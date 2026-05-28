import { normalize } from '@/utils/normalize';

describe('normalize', () => {
	it('converts text to lowercase', () => {
		expect(normalize('HOLA MUNDO')).toBe('hola mundo');
	});

	it('removes accents', () => {
		expect(normalize('Canción')).toBe('cancion');
	});

	it('removes multiple accented characters', () => {
		expect(normalize('ÁÉÍÓÚ áéíóú')).toBe('aeiou aeiou');
	});

	it('trims leading and trailing spaces', () => {
		expect(normalize('   hola mundo   ')).toBe('hola mundo');
	});

	it('keeps inner spaces intact', () => {
		expect(normalize('hola    mundo')).toBe('hola    mundo');
	});

	it('handles mixed casing and accents together', () => {
		expect(normalize('  ÁrBoL ÉxItO  ')).toBe('arbol exito');
	});

	it('handles empty string', () => {
		expect(normalize('')).toBe('');
	});

	it('handles string with only spaces', () => {
		expect(normalize('     ')).toBe('');
	});

	it('does not modify numbers', () => {
		expect(normalize('Producto 123')).toBe('producto 123');
	});

	it('does not remove punctuation', () => {
		expect(normalize('Hola, mundo!')).toBe('hola, mundo!');
	});

	it('handles ñ correctly', () => {
		expect(normalize('Niñez')).toBe('ninez');
	});

	it('handles umlauts correctly', () => {
		expect(normalize('Pingüino')).toBe('pinguino');
	});

	it('handles already normalized strings', () => {
		expect(normalize('hola mundo')).toBe('hola mundo');
	});

	it('normalizes searchable user input consistently', () => {
		const dbValue = 'José Pérez';
		const searchInput = ' jose perez ';

		expect(normalize(dbValue)).toBe(normalize(searchInput));
	});
});
