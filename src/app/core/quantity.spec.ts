import { formatQuantity } from './quantity';

describe('formatQuantity', () => {
  it('scales amounts and formats units and fractions', () => {
    expect(formatQuantity({ qty: 400, unit: 'g', name: 'beans' }, 1)).toBe('400g');
    expect(formatQuantity({ qty: 2, unit: 'tbsp', name: 'oil' }, 0.5)).toBe('1 tbsp');
    expect(formatQuantity({ qty: 1, unit: 'tsp', name: 'salt' }, 1.5)).toBe('1½ tsp');
    expect(formatQuantity({ qty: 1, unit: 'tsp', name: 'salt' }, 0.5)).toBe('½ tsp');
    expect(formatQuantity({ qty: 3, name: 'eggs' }, 2)).toBe('6');
    expect(formatQuantity({ unit: 'pinch', name: 'flaky salt' }, 3)).toBe('pinch');
    expect(formatQuantity({ name: 'maple syrup, to serve' }, 3)).toBe('');
  });
});
