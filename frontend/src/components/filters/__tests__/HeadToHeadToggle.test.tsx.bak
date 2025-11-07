import HeadToHeadToggle from '../HeadToHeadToggle';

describe('HeadToHeadToggle (functional)', () => {
  test('invokes onChange when checkbox toggled', () => {
    const handle = jest.fn();
    const el = (HeadToHeadToggle as any)({ value: false, onChange: handle, label: 'Test' });

    // find input element in returned React element
    const findInput = (node: any): any => {
      if (!node || !node.props) return null;
      if (node.type === 'input') return node;
      const children = Array.isArray(node.props.children) ? node.props.children : [node.props.children];
      for (const c of children) {
        if (!c) continue;
        if (typeof c === 'object') {
          const found = findInput(c);
          if (found) return found;
        }
      }
      return null;
    };

    const input = findInput(el);
    expect(input).not.toBeNull();
    expect(input.props.type).toBe('checkbox');
    expect(input.props.checked).toBe(false);

    // simulate change
    input.props.onChange({ target: { checked: true } });
    expect(handle).toHaveBeenCalledWith(true);
  });
});
