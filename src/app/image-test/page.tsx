import OptimizedImage from '@/components/common/OptimizedImage';

export default function ImageTestPage() {
  const testBackdropUrl = 'https://image.tmdb.org/t/p/w1280/7q448EVOnuE3gVAx24krzO7SNXM.jpg';
  const testPosterUrl = 'https://image.tmdb.org/t/p/w300/wwemzKWzjKYJFfCeiB57q3r4Bcm.png';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Image Component Test</h1>
      
      <div className="space-y-8">
        {/* Test 1: Fill backdrop image */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Backdrop Image (Fill)</h2>
          <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden">
            <OptimizedImage
              src={testBackdropUrl}
              alt="Test backdrop"
              fill
              className="object-cover object-center"
              priority
              imageType="backdrop"
              sizes="100vw"
              quality={75}
            />
          </div>
        </div>

        {/* Test 2: Fixed size poster image */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Poster Image (Fixed Size)</h2>
          <div className="flex justify-center">
            <OptimizedImage
              src={testPosterUrl}
              alt="Test poster"
              width={300}
              height={450}
              className="rounded-lg"
              priority
              imageType="poster"
              quality={80}
            />
          </div>
        </div>

        {/* Test 3: Error handling */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Error Handling Test</h2>
          <div className="relative w-full h-48 bg-gray-800 rounded-lg overflow-hidden">
            <OptimizedImage
              src="https://invalid-url.com/nonexistent.jpg"
              alt="Test error"
              fill
              className="object-cover object-center"
              priority
              imageType="backdrop"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
