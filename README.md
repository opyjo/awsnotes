# AWS Study Notes & Flashcards Application

A full-stack web application for AWS certification exam preparation. Create study notes with screenshots, generate flashcards, and review them using spaced repetition.

## Features

- 📝 **Rich Text Notes**: Create and edit notes with TipTap editor, support for images, code blocks, and markdown
- 🎴 **Flashcards**: Generate flashcards from notes and organize them into decks
- 🔄 **Spaced Repetition**: Review flashcards using the proven SM-2 algorithm
- 📸 **Image Upload**: Upload screenshots and images to S3 with CloudFront CDN
- 🔐 **Authentication**: Secure authentication with AWS Cognito
- 📊 **Dashboard**: Track your progress with statistics and recent notes

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: AWS AppSync (GraphQL), DynamoDB, S3, Cognito
- **Editor**: TipTap
- **State Management**: React Context

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS account with configured services:
  - Cognito User Pool
  - AppSync GraphQL API
  - DynamoDB tables
  - S3 bucket
  - CloudFront distribution (optional)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd awsstudynote
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.local.example` to `.env.local` and fill in your AWS configuration:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your AWS service endpoints and credentials.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AWS Setup

### DynamoDB Tables

Create two tables with the following schemas:

**Notes Table**
- Partition Key: `PK` (String)
- Sort Key: `SK` (String)
- GSI: `userId-index` on `PK`

**Flashcards Table**
- Partition Key: `PK` (String)
- Sort Key: `SK` (String)
- GSI: `userId-index` on `PK`, `nextReviewDate-index` on `nextReviewDate`

### AppSync Schema

See the GraphQL schema in the plan document for the required types and resolvers.

### S3 Bucket

Create an S3 bucket for image storage and configure CORS. Set up CloudFront distribution for CDN (optional but recommended).

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── notes/            # Note-related components
│   ├── flashcards/      # Flashcard components
│   └── layout/          # Layout components
├── context/              # React Context providers
├── lib/                  # Utility libraries
│   ├── aws/             # AWS service integrations
│   └── spaced-repetition/ # SM-2 algorithm
└── types/                # TypeScript type definitions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT
