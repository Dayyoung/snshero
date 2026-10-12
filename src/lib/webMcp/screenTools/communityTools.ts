/**
 * WebMCP Screen Tools for CommunityView & RedditCommunityView
 */

import { WebMcpToolDefinition } from '../types';

export interface CommunityToolDependencies {
  onCreatePost?: (title: string, content: string, channel: string) => void;
  getPosts?: () => any[];
}

export function createCommunityWebMcpTools(deps: CommunityToolDependencies): WebMcpToolDefinition[] {
  return [
    {
      name: 'community_create_post',
      description: 'Publish a new post to the SNSHero community feed.',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Post title'
          },
          content: {
            type: 'string',
            description: 'Post content body'
          },
          channel: {
            type: 'string',
            description: 'Community channel category (free, strategy, deck, gacha)',
            default: 'free'
          }
        },
        required: ['title', 'content']
      },
      annotations: {
        readOnlyHint: false,
        consequentialHint: true,
        untrustedContentHint: true
      },
      screen: 'community',
      execute: async ({ title, content, channel = 'free' }) => {
        if (deps.onCreatePost) {
          deps.onCreatePost(title, content, channel);
        }
        return {
          success: true,
          title,
          channel,
          message: `Created community post: "${title}".`
        };
      }
    },

    {
      name: 'community_get_feed_posts',
      description: 'Fetch recent discussion posts from community boards.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      annotations: {
        readOnlyHint: true
      },
      screen: 'community',
      execute: async () => {
        if (deps.getPosts) {
          return deps.getPosts();
        }
        return {
          message: 'Community board active.'
        };
      }
    }
  ];
}
