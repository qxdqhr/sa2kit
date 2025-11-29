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

#### Default Import (Recommended)
```tsx
import PhotoWall, { PhotoWallProps } from '@qhr123/sa2kit/photoWall';

const props: PhotoWallProps = {
  source: 'images',
  type: 'public',
  initialLayout: 'masonry',
  onSelectionChange: (selected) => console.log(selected)
};

<PhotoWall {...props} />
```

#### Named Import
```tsx
import { PhotoWall, PhotoWallProps, createPhotoWallConfig } from '@qhr123/sa2kit/photoWall';

const config = createPhotoWallConfig({
  source: 'images',
  type: 'public',
  initialLayout: 'masonry'
});

<PhotoWall {...config} />
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

## Architecture Benefits

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be used independently
3. **Maintainability**: Easier to test and modify individual parts
4. **Type Safety**: Proper TypeScript definitions throughout
5. **Performance**: Better tree-shaking and code splitting potential

