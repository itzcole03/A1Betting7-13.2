import TimeframeSelect from '../TimeframeSelect';

function findByTag(element: any, tag: string): any | null {
  if (!element || !element.props) return null;
  if (element.type === tag) return element;
  const children = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
  for (const c of children) {
    if (!c) continue;
    if (typeof c === 'object') {
      const found = findByTag(c, tag);
      if (found) return found;
    }
  }
  return null;
}

describe('TimeframeSelect (functional)', () => {
  test('calls onChange with number when value changes', () => {
    const handle = jest.fn();
    // Call component as plain function to get React element
    const el = (TimeframeSelect as any)({ value: 10, onChange: handle });

    const select = findByTag(el, 'select');
    expect(select).not.toBeNull();
    expect(select.props.value).toBe('10');

    // Invoke handler directly
    select.props.onChange({ target: { value: '5' } });
    expect(handle).toHaveBeenCalledWith(5);
  });

  test('selecting All passes undefined', () => {
    const handle = jest.fn();
    const el = (TimeframeSelect as any)({ value: 10, onChange: handle });
    const select = findByTag(el, 'select');
    select.props.onChange({ target: { value: 'all' } });
    expect(handle).toHaveBeenCalledWith(undefined);
  });
});
