import imageCompression from 'browser-image-compression';

import { optimizeFile } from '@/utils/optimization-images';
import { isImage } from '@/utils/file-upload-utils';

jest.mock('browser-image-compression', () => jest.fn());

jest.mock('@/utils/file-upload-utils', () => ({
	isImage: jest.fn(),
}));

describe('optimizeFile', () => {
	const mockedImageCompression = imageCompression as jest.MockedFunction<typeof imageCompression>;
	const mockedIsImage = isImage as jest.MockedFunction<typeof isImage>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('compresses large image files', async () => {
		const originalFile = new File(['fake-image'], 'photo.jpg', {
			type: 'image/jpeg',
		});

		Object.defineProperty(originalFile, 'size', {
			value: 600 * 1024,
		});

		const compressedBlob = new Blob(['compressed'], {
			type: 'image/webp',
		});
		const compressedFile = new File([compressedBlob], 'compressed.webp', {
			type: 'image/webp',
		});

		mockedIsImage.mockReturnValue(true);
		mockedImageCompression.mockResolvedValue(compressedFile);

		const result = await optimizeFile(originalFile);

		expect(imageCompression).toHaveBeenCalledTimes(1);

		expect(imageCompression).toHaveBeenCalledWith(
			originalFile,
			expect.objectContaining({
				maxSizeMB: 1,
				maxWidthOrHeight: 1920,
				useWebWorker: true,
				fileType: 'image/webp',
			})
		);

		expect(result.name).toBe('photo.webp');
		expect(result.type).toBe('image/webp');
	});

	it('does not compress small image files', async () => {
		const smallImage = new File(['small'], 'small.jpg', {
			type: 'image/jpeg',
		});

		Object.defineProperty(smallImage, 'size', {
			value: 100 * 1024,
		});

		mockedIsImage.mockReturnValue(true);

		const result = await optimizeFile(smallImage);

		expect(imageCompression).not.toHaveBeenCalled();
		expect(result).toBe(smallImage);
	});

	it('does not compress non-image files', async () => {
		const pdfFile = new File(['pdf'], 'document.pdf', {
			type: 'application/pdf',
		});

		Object.defineProperty(pdfFile, 'size', {
			value: 2 * 1024 * 1024,
		});

		mockedIsImage.mockReturnValue(false);

		const result = await optimizeFile(pdfFile);

		expect(imageCompression).not.toHaveBeenCalled();
		expect(result).toBe(pdfFile);
	});

	it('handles png image conversion to webp', async () => {
		const pngFile = new File(['png'], 'image.png', {
			type: 'image/png',
		});

		Object.defineProperty(pngFile, 'size', {
			value: 800 * 1024,
		});

		const compressedBlob = new Blob(['compressed'], {
			type: 'image/webp',
		});
		const compressedFile = new File([compressedBlob], 'compressed.webp', {
			type: 'image/webp',
		});

		mockedIsImage.mockReturnValue(true);
		mockedImageCompression.mockResolvedValue(compressedFile);

		const result = await optimizeFile(pngFile);

		expect(result.name).toBe('image.webp');
		expect(result.type).toBe('image/webp');
	});

	it('propagates compression errors', async () => {
		const imageFile = new File(['image'], 'broken.jpg', {
			type: 'image/jpeg',
		});

		Object.defineProperty(imageFile, 'size', {
			value: 700 * 1024,
		});

		mockedIsImage.mockReturnValue(true);

		mockedImageCompression.mockRejectedValue(new Error('Compression failed'));

		await expect(optimizeFile(imageFile)).rejects.toThrow('Compression failed');
	});
});
