import bcrypt from 'bcryptjs';

const passwords = [
	{ usuario: 'Admin', contraseña: 'admin123' },
	{ usuario: 'Ventas', contraseña: 'ventas123' },
	{ usuario: 'Marketing', contraseña: 'marketing123' },
	{ usuario: 'Fabrica', contraseña: 'fabrica123' },
	{ usuario: 'Colocador', contraseña: 'colocador123' },
];

const hashPasswords = async () => {
	for (const user of passwords) {
		const hashed = await bcrypt.hash(user.contraseña, 10);
		console.log(`${user.usuario}: ${hashed}`);
	}
};

hashPasswords();
