import { RequestWithTheme } from '@shared/types/Requests';
import { Response } from 'express';
import { getGallerySidebarData } from './galleryUtils';

// Helper function to render pages with common data
export function renderPage(req: RequestWithTheme, res: Response, page: string, data: Record<string, any> = {}) {
    res.render(page, {
        theme: req.theme,
        ...getGallerySidebarData(),
        ...data
    });
} 