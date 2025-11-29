# PhotoWall Component - Modular Structure

This directory contains the modularized PhotoWall component, refactored from a single large file into organized modules.

## Directory Structure

```
src/photoWall/
├── components/           # React components
│   ├── Lightbox.tsx     # Image preview modal
│   ├── ImageEditor.tsx  # Canvas-based image editor
│   ├── SortableItem.tsx # Drag-and-drop sortable item
│   ├── Skeleton.tsx     # Loading skeleton
│   └── AlbumManager.tsx # Album management modal
├── utils/               # Utility functions
│   ├── albumUtils.ts    # Album management utilities
│   └── imageUtils.ts    # Image processing utilities
├── types.ts            # TypeScript type definitions
├── index.tsx           # Main PhotoWall component
└── README.md           # This file
```

## Features

- **Drag & Drop**: Reorder images within albums using `@dnd-kit`
- **Image Editor**: Canvas-based editing with rotation, filters, and cropping
- **Album Management**: Create, rename, delete albums and move images
- **Timeline View**: Group images by date
- **Search & Selection**: Filter images and batch operations
- **Persistence**: Local storage for album organization

## Dependencies

```json
{
  "@dnd-kit/core": "^6.3.1",
  "@dnd-kit/sortable": "^10.0.0",
  "@dnd-kit/utilities": "^3.2.2",
  "framer-motion": "^12.23.24",
  "lucide-react": "^0.553.0"
}
```

## Usage

### Frontend Component

#### Direct Image Array (Required)
```tsx
import PhotoWall from '@qhr123/sa2kit/photoWall';

const imageUrls = [
  'https://example.com/image1.jpg',
  'https://example.com/image2.png',
  '/images/local-image.jpg'
];

<PhotoWall
  images={imageUrls}
  initialLayout="masonry"
  onSelectionChange={(selected) => console.log(selected)}
/>
```

#### Basic Usage
```tsx
import PhotoWall from '@qhr123/sa2kit/photoWall';

const images = ['image1.jpg', 'image2.png', 'image3.webp'];

<PhotoWall images={images} />
```

#### Advanced Configuration
```tsx
import { PhotoWall, PhotoWallProps } from '@qhr123/sa2kit/photoWall';

const props: PhotoWallProps = {
  images: ['img1.jpg', 'img2.png', 'img3.webp'],
  initialLayout: 'grid',
  onSelectionChange: (selected) => console.log('Selected:', selected)
};

<PhotoWall {...props} />
```

### Backend API

The PhotoWall component requires a backend API to fetch image lists. Use the provided API route handlers:

#### Next.js App Router
```typescript
// app/api/images/route.ts
import { createImagesHandler, createImagesOptionsHandler } from '@qhr123/sa2kit/photoWall/backend';

export const GET = createImagesHandler({
  imageProvider: {
    type: 'file',
    baseUrl: '/images'
  }
});

export const OPTIONS = createImagesOptionsHandler();
```

#### Next.js Pages Router
```typescript
// pages/api/images.ts
import { createImagesApiRoutes } from '@qhr123/sa2kit/photoWall/backend';

const { GET, OPTIONS } = createImagesApiRoutes({
  imageProvider: {
    type: 'file',
    baseUrl: '/images'
  }
});

export { GET, OPTIONS };
```

#### API Configuration
```typescript
import { createImagesHandler, ImagesApiConfig } from '@qhr123/sa2kit/photoWall/backend';

const config: ImagesApiConfig = {
  basePath: '/api/images',
  cors: {
    enabled: true,
    origin: '*',
    methods: ['GET', 'OPTIONS'],
  },
  imageProvider: {
    type: 'file', // 'file' | 'oss' | 'custom'
    baseUrl: '/images',
  },
};
```

#### File Structure Setup
For the file system provider, organize your images like this:
```
public/
├── images/
│   ├── gallery1/
│   │   ├── image1.jpg
│   │   ├── image2.png
│   │   └── image3.webp
│   ├── gallery2/
│   │   ├── photo1.jpg
│   │   └── photo2.jpg
│   └── portfolio/
│       ├── work1.jpg
│       └── work2.jpg
```

#### API Response
```typescript
// GET /api/images?dir=gallery1&type=public
{
  "success": true,
  "data": {
    "images": [
      "/images/gallery1/image1.jpg",
      "/images/gallery1/image2.png",
      "/images/gallery1/image3.webp"
    ],
    "total": 3,
    "hasMore": false
  }
}
```

## Architecture Benefits

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be used independently
3. **Maintainability**: Easier to test and modify individual parts
4. **Type Safety**: Proper TypeScript definitions throughout
5. **Performance**: Better tree-shaking and code splitting potential

