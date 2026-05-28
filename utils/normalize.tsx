// Utility function to normalize strings by removing accents,
// converting to lowercase, and trimming whitespace
// We use it to group items without taking into account uppercase letters, accents, etc.
export const normalize = (str: string) =>
	str
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim();
