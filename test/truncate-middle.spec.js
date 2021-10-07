import { mount, createLocalVue } from '@vue/test-utils';
import units from 'units-css';
import ElTruncateMiddle from 'packages/widgets/truncate-middle';
import Vue from 'vue';

const localVue = createLocalVue();
localVue.use(ElTruncateMiddle);
const TEST_TEXT_FITS = {
  component: { width: units.parse('100px'), height: units.parse('20px') },
  ellipsis: { width: units.parse('10px'), height: units.parse('20px') },
  text: { width: units.parse('80px'), height: units.parse('20px') }
};

const TEST_TEXT_OVERFLOWS = {
  component: { width: units.parse('80px'), height: units.parse('20px') },
  ellipsis: { width: units.parse('10px'), height: units.parse('20px') },
  text: { width: units.parse('100px'), height: units.parse('20px') }
};

const TEST_ELLIPSIS_OVERFLOWS = {
  component: { width: units.parse('4px'), height: units.parse('20px') },
  ellipsis: { width: units.parse('10px'), height: units.parse('20px') },
  text: { width: units.parse('100px'), height: units.parse('20px') }
};

function MockSelection(str) {
  this.selectedText = str;
}

MockSelection.prototype.toString = () => {
  return this.selectedText;
};

function MockClipboardEvent(data, options = { dataType: 'text/plain', bubbles: true, cancelable: false }) {
  this.data = data;
  this.dataType = options.dataType;
  this.bubbles = options.dataType;
  this.cancelable = options.dataType;

  this.clipboardData = {
    setData: sinon.stub()
  };
}

describe('ElTruncateMiddle component', () => {
  let component;

  let calculateMeasurementsStub;
  let onResizeSpy;
  let parseTextForTruncationSpy;

  beforeEach(() => {
    // Stub out the calculateMeasurements method so that we can control the execution path of the tests.
    // calculateMeasurementsStub = sinon.stub(ElTruncateMiddle.prototype, 'calculateMeasurements');

    // Spy on methods so we can assert certain behaviors
    // onResizeSpy = sinon.spy(ElTruncateMiddle.prototype, 'onResize');
    // parseTextForTruncationSpy = sinon.spy(ElTruncateMiddle.prototype, 'parseTextForTruncation');

    // Set the default behaviour of the calculateMeasurementsStub
    // calculateMeasurementsStub.returns(TEST_TEXT_FITS);
    const calculateMeasurementsStub = jest.spyOn(ElTruncateMiddle.methods, 'calculateMeasurements').mockReturnValue(TEST_TEXT_FITS);

    component = mount({
      template: `<ElTruncateMiddle
        class="test"
        text="0123456789"
      />` },
      { localVue });
  });

  afterEach(() => {
    // Restore the spies and stubs
    // calculateMeasurementsStub();
    // onResizeSpy.restore();
    // parseTextForTruncationSpy.restore();

    component = null;
    calculateMeasurementsStub = null;
    onResizeSpy = null;
    parseTextForTruncationSpy = null;
  });

  describe('#rendering', () => {
    it('should be a function', () => {
      expect(ElTruncateMiddle).toBe('function');
    });

    it('should render a div as the root node', () => {
      expect(component).toBeInstanceOf(VueWrapper);
    });

    it('should pass the className prop to the root node of the component', () => {
      expect(component.classes()).toContain('test');
    });

    it('should render a hidden text span', () => {
      const node = component.$refs.text;

      expect(node.exists()).toBeTruthy();
      expect(node.innerHTML).toEqual('0123456789');
    });

    it('should render a hidden ellipsis span', () => {
      const node = component.ref('ellipsis');

      expect(node).to.exist;
      expect(node.innerHTML).toEqual('...');
    });

    it('should render the custom ellipsis provided via props', () => {
      const ellipsis = '😎';
      component.setProps({ ellipsis });

      const node = component.ref('ellipsis');
      expect(node.innerHTML).toEqual(ellipsis);
    });
  });

  describe('#behaviour', () => {
    let clock;

    beforeEach(() => {
      // Control the timers so that we can advance the clock to trigger the debounced functions
      clock = sinon.useFakeTimers();

      // Unmount the component, so that we can test the mounting of the component in the suites below
      component.unmount();
    });

    afterEach(() => {
      // Restore the timers
      clock.restore();
      clock = null;
    });

    describe('when the text fits within the available space', () => {
      beforeEach(() => {
        calculateMeasurementsStub.returns(TEST_TEXT_FITS);
        component.mount();

        // Advance the timer so the debounced parseTextForTruncation is executed
        clock.tick(1);
      });

      it('should NOT truncate the text', () => {
        expect(component.state('truncatedText')).toEqual('0123456789');
      });
    });

    describe('when the available space is smaller than the ellipsis width', () => {
      beforeEach(() => {
        calculateMeasurementsStub.returns(TEST_ELLIPSIS_OVERFLOWS);
        component.mount();

        // Advance the timer so the debounced parseTextForTruncation is executed
        clock.tick(1);
      });

      it('should truncate the text', () => {
        expect(component.state('truncatedText')).toEqual('...');
      });
    });

    describe('when the text overflows the available space', () => {
      beforeEach(() => {
        calculateMeasurementsStub.returns(TEST_TEXT_OVERFLOWS);
        component.mount();

        // Advance the timer so the debounced parseTextForTruncation is executed
        clock.tick(1);
      });

      it('should truncate the text', () => {
        expect(component.state('truncatedText')).toEqual('012...789');
      });

      describe('and the start prop is set to an integer', () => {
        beforeEach(() => {
          component.setProps({ start: 4 });
          component.unmount();
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        it('should truncate the text, preserving the start by the specified number of characters', () => {
          expect(component.state('truncatedText')).toEqual('0123...789');
        });
      });

      describe('and the end prop is set to an integer', () => {
        beforeEach(() => {
          component.setProps({ end: 4 });
          component.unmount();
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        it('should truncate the text, preserving the end by the specified number of characters', () => {
          expect(component.state('truncatedText')).toEqual('012...6789');
        });
      });

      describe('and the start prop is set to a RegExp', () => {
        beforeEach(() => {
          component.setProps({ start: /^\d{4}/ });
          component.unmount();
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        it('should truncate the text, preserving the start as matched by the regular expression', () => {
          expect(component.state('truncatedText')).toEqual('0123...789');
        });
      });

      describe('and the end prop is set to a RegExp', () => {
        beforeEach(() => {
          component.setProps({ end: /\d{4}$/ });
          component.unmount();
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        it('should truncate the text, preserving the end as matched by the regular expression', () => {
          expect(component.state('truncatedText')).toEqual('012...6789');
        });
      });

      describe('and the start and end props are used in conjunction', () => {
        beforeEach(() => {
          component.setProps({ start: 4, end: /\d{4}$/ });
          component.unmount();
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        it('should truncate the text, preserving the start and the end accordingly', () => {
          expect(component.state('truncatedText')).toEqual('0123...6789');
        });
      });
    });

    describe('when the window is resized', () => {
      beforeEach(() => {
        calculateMeasurementsStub.returns(TEST_TEXT_OVERFLOWS);
        component.mount();

        // Advance the timer so the debounced parseTextForTruncation is executed
        clock.tick(1);

        // Reset the spy calls which would have been called on mount
        parseTextForTruncationSpy.resetHistory();
        onResizeSpy.resetHistory();

        // Dispatch a resize event on the window
        window.dispatchEvent(new Event('resize'));
      });

      describe('and the component remains mounted', () => {
        beforeEach(() => {
          const onResizeDebounceMs = component.prop('onResizeDebounceMs');

          // Advance the clock by the amount specified for the `onResize` debounce
          clock.tick(onResizeDebounceMs + 1);
        });

        it('should call the debounced `onResize` handler', () => {
          onResizeSpy.should.have.been.called;
        });

        it('should call the debounced `parseTextForTruncation` handler', () => {
          parseTextForTruncationSpy.should.have.been.called;
        });

        it('should call the debounced `parseTextForTruncation` handler with the correct arguments', () => {
          const text = component.prop('text');
          parseTextForTruncationSpy.should.have.been.calledWith(text);
        });
      });

      describe('and the component is unmounted before the `onResize` handler is called', () => {
        beforeEach(() => {
          const onResizeDebounceMs = component.prop('onResizeDebounceMs');

          component.unmount();

          // Advance the clock by the amount specified for the `onResize` debounce
          clock.tick(onResizeDebounceMs);
        });

        it('should NOT call the debounced `onResize` handler', () => {
          onResizeSpy.should.not.have.been.called;
        });

        it('should NOT call the debounced `parseTextForTruncation` handler', () => {
          parseTextForTruncationSpy.should.not.have.been.called;
        });
      });
    });

    describe('when the user selects and copies the rendered text to the clipboard', () => {
      let getSelectionStub;
      let clipboardEvent;
      let selection;
      let selectedText;

      beforeEach(() => {
        getSelectionStub = sinon.stub(window, 'getSelection');
        calculateMeasurementsStub.returns(TEST_TEXT_OVERFLOWS);
      });

      afterEach(() => {
        getSelectionStub.restore();

        clipboardEvent = null;
        selection = null;
        selectedText = null;
      });

      describe('smartCopy is set to false', () => {
        beforeEach(() => {
          component.setProps({ smartCopy: false });
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        describe('and the text selection is a fractal', () => {
          beforeEach(() => {
            selection = new MockSelection('234');
            selectedText = selection.toString();

            getSelectionStub.returns(selection);
            clipboardEvent = new MockClipboardEvent(selectedText);

            component.simulate('copy', clipboardEvent);
          });

          it('should not get the selected text', () => {
            getSelectionStub.should.not.have.been.calledOnce;
          });

          it('should not override the default copy behaviour', () => {
            clipboardEvent.clipboardData.setData.should.not.have.been.called;
          });
        });

        describe('and the text selection is the entire truncated text', () => {
          beforeEach(() => {
            selection = new MockSelection('012...789');
            selectedText = selection.toString();

            getSelectionStub.returns(selection);
            clipboardEvent = new MockClipboardEvent(selectedText);

            component.simulate('copy', clipboardEvent);
          });

          it('should not get the selected text', () => {
            getSelectionStub.should.not.have.been.calledOnce;
          });

          it('should not override the default copy behaviour', () => {
            clipboardEvent.clipboardData.setData.should.not.have.been.called;
          });
        });
      });

      describe('smartCopy is set to "partial"', () => {
        beforeEach(() => {
          component.setProps({ smartCopy: 'partial' });
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        describe('and the text selection is a fractal', () => {
          beforeEach(() => {
            selection = new MockSelection('234');
            selectedText = selection.toString();

            getSelectionStub.returns(selection);
            clipboardEvent = new MockClipboardEvent(selectedText);

            component.simulate('copy', clipboardEvent);
          });

          it('should get the selected text', () => {
            getSelectionStub.should.have.been.calledOnce;
            getSelectionStub.should.have.returned(selection);
          });

          it('should set the clipboardData value to the full untruncated text', () => {
            clipboardEvent.clipboardData.setData.should.have.been.calledWith('text/plain', component.prop('text'));
          });
        });

        describe('and the text selection is the entire truncated text', () => {
          beforeEach(() => {
            selection = new MockSelection('012...789');
            selectedText = selection.toString();

            getSelectionStub.returns(selection);
            clipboardEvent = new MockClipboardEvent(selectedText);

            component.simulate('copy', clipboardEvent);
          });

          it('should get the selected text', () => {
            getSelectionStub.should.have.been.calledOnce;
            getSelectionStub.should.have.returned(selection);
          });

          it('should set the clipboardData value to the full untruncated text', () => {
            clipboardEvent.clipboardData.setData.should.have.been.calledWith('text/plain', component.prop('text'));
          });
        });
      });

      describe('smartCopy is set to "all"', () => {
        beforeEach(() => {
          component.setProps({ smartCopy: 'all' });
          component.mount();

          // Advance the timer so the debounced parseTextForTruncation is executed
          clock.tick(1);
        });

        describe('and the text selection is a fractal', () => {
          beforeEach(() => {
            selection = new MockSelection('234');
            selectedText = selection.toString();

            getSelectionStub.returns(selection);
            clipboardEvent = new MockClipboardEvent(selectedText);

            component.simulate('copy', clipboardEvent);
          });

          it('should get the selected text', () => {
            getSelectionStub.should.have.been.calledOnce;
            getSelectionStub.should.have.returned(selection);
          });

          it('should not override the default copy behaviour', () => {
            clipboardEvent.clipboardData.setData.should.not.have.been.called;
          });
        });

        describe('and the text selection is the entire truncated text', () => {
          beforeEach(() => {
            selection = new MockSelection('012...789');
            selectedText = selection.toString();

            getSelectionStub.returns(selection);
            clipboardEvent = new MockClipboardEvent(selectedText);

            component.simulate('copy', clipboardEvent);
          });

          it('should get the selected text', () => {
            getSelectionStub.should.have.been.calledOnce;
            getSelectionStub.should.have.returned(selection);
          });

          it('should set the clipboardData value to the full untruncated text', () => {
            clipboardEvent.clipboardData.setData.should.have.been.calledWith('text/plain', component.prop('text'));
          });
        });
      });
    });
  });
});
