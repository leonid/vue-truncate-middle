<script>
import { debounce, toFinite } from 'lodash';
import units from 'units-css';
import resize from 'vue-resize-directive';
import measureText from './measure-text';

const getStartOffset = (start, text) => {
  if (start === '' || start === null) {
    return 0;
  }

  if (!isNaN(parseInt(start, 10))) {
    return Math.round(toFinite(start));
  }

  const result = new RegExp(start).exec(text);
  return result ? result.index + result[0].length : 0;
};

const getEndOffset = (end, text) => {
  if (end === '' || end === null) {
    return 0;
  }

  if (!isNaN(parseInt(end, 10))) {
    return Math.round(toFinite(end));
  }

  const result = new RegExp(end).exec(text);
  return result ? result[0].length : 0;
};

// A React component for truncating text in the middle of the string.
//
// This component automatically calculates the required width and height of the text
// taking into consideration any inherited font and line-height styles, and compares it to
// the available space to determine whether to truncate or not.

// By default the component will truncate the middle of the text if
// the text would otherwise overflow using a position 0 at the start of the string,
// and position 0 at the end of the string.
//
// You can pass start and end props a number to offset this position, or alternatively
// a Regular Expression to calculate these positions dynamically against the text itself.
export default {
  name: 'ElTruncateMiddle',
  directives: {
    resize
  },
  props: {
    ellipsis: { type: String, default: '...' },
    end: {
      type: [Number, RegExp, String],
      default: 0
    },
    onResizeDebounceMs: {
      type: Number,
      default: 100
    },
    smartCopy: {
      default: 'all',
      type: [String, Boolean],
      validator: (value) => (typeof value === 'string'
        ? ['partial', 'all'].includes(value)
        : value)
    },
    start: {
      type: [Number, RegExp, String],
      default: 0
    },
    text: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      truncatedText: this.$props.text,
      startPos: getStartOffset(this.$props.start, this.$props.text),
      endPos: getEndOffset(this.$props.end, this.$props.text)
    };
  },
  watch: {
    text(val) {
      this.parseTextForTruncation(val);
    },
    start(val) {
      this.start = getStartOffset(val, this.text);
    },
    end(val) {
      this.end = getEndOffset(val, this.text);
    }
  },
  created() {
    this.parseTextForTruncation = debounce(this.parseTextForTruncation.bind(this), 0);
    // this.onResize = debounce(this.onResize.bind(this), this.onResizeDebounceMs);
  },
  mounted() {
    this.parseTextForTruncation(this.text);
    // window.addEventListener('resize', this.onResize);
  },
  updated() {

  },
  destroyed() {
    // Cancel any pending debounced functions
    // this.onResize.cancel();
    this.parseTextForTruncation.cancel();

    // window.removeEventListener('resize', this.onResize);
  },
  methods: {
    onResize() {
      console.log('onResize');
      this.parseTextForTruncation(this.text);
    },
    onCopy(event) {
      const { smartCopy } = this;

      // If smart copy is not enabled, simply return and use the default behaviour of the copy event
      if (!smartCopy) {
        return;
      }

      const selectedText = window.getSelection()
        .toString();

      // If smartCopy is set to partial or if smartCopy is set to all and the entire string was selected
      // copy the original full text to the user's clipboard
      if (smartCopy === 'partial' || (smartCopy === 'all' && selectedText === this.truncatedText)) {
        event.preventDefault();
        const clipboardData = event.clipboardData || window.clipboardData || event.originalEvent.clipboardData;

        clipboardData.setData('text/plain', this.text);
      }
    },
    getTextMeasurement(ref) {
      const node = ref;
      const text = node.textContent;

      const {
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle
      } = window.getComputedStyle(node);

      const { width, height } = measureText({
        text,
        fontFamily,
        fontSize,
        fontWeight,
        fontStyle,
        lineHeight: 1
      });

      console.log({ width, height });
      return { width, height };
    },
    getComponentMeasurement() {
      const node = this.$refs.component;

      const offsetWidth = node && node.offsetWidth ? node.offsetWidth : 0;
      const offsetHeight = node && node.offsetHeight ? node.offsetHeight : 0;

      return {
        width: units.parse(offsetWidth, 'px'),
        height: units.parse(offsetHeight, 'px')
      };
    },
    calculateMeasurements() {
      return {
        component: this.getComponentMeasurement(),
        ellipsis: this.getTextMeasurement(this.$refs.ellipsis),
        text: this.getTextMeasurement(this.$refs.text)
      };
    },
    truncateText(measurements) {
      const { text, ellipsis, startPos, endPos } = this;

      if (measurements.component.width.value <= measurements.ellipsis.width.value) {
        return ellipsis;
      }

      const delta = Math.ceil(measurements.text.width.value - measurements.component.width.value);
      const totalLettersToRemove = Math.ceil(delta / measurements.ellipsis.width.value);
      const middleIndex = Math.round(text.length / 2);

      const preserveLeftSide = text.slice(0, startPos);
      const leftSide = text.slice(startPos, middleIndex - totalLettersToRemove);
      const rightSide = text.slice(middleIndex + totalLettersToRemove, text.length - endPos);
      const preserveRightSide = text.slice(text.length - endPos, text.length);

      return `${preserveLeftSide}${leftSide}${ellipsis}${rightSide}${preserveRightSide}`;
    },
    parseTextForTruncation(text) {
      const measurements = this.calculateMeasurements();

      this.truncatedText = Math.round(measurements.text.width.value) > Math.round(measurements.component.width.value)
        ? this.truncateText(measurements)
        : text;
    }
  },
  render() {
    const { text, ellipsis, onResizeDebounceMs, smartCopy, ...otherProps } = this;
    const { truncatedText } = this;

    const directives = [
      { name: 'resize', value: this.onResize, modifiers: { debounce: true } }
    ];

    const componentStyle = {
      display: 'block',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    };

    const hiddenStyle = {
      display: 'none'
    };

    return (
      <div
        ref="component"
        style={componentStyle}
        onCopy={this.onCopy}
        {...{ directives }}
        {...otherProps}>
        <span ref="text" style={hiddenStyle}>{text}</span>
        <span ref="ellipsis" style={hiddenStyle}>{ellipsis}</span>

        {truncatedText}
      </div>
    );
  }
};
</script>
