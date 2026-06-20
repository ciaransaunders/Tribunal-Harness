import { describe, it, expect } from 'vitest';
import { cn } from './ui-utils';

describe('cn utility', () => {
    it('should merge basic string classes', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle tailwind class conflicts correctly', () => {
        expect(cn('p-4', 'p-8')).toBe('p-8');
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
        expect(cn('flex flex-col', 'flex-row')).toBe('flex flex-row');
    });

    it('should correctly handle conditional classes with objects', () => {
        expect(cn('base-class', { 'active-class': true, 'inactive-class': false })).toBe('base-class active-class');
    });

    it('should handle arrays of classes', () => {
        expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle falsy values', () => {
        expect(cn('class1', null, undefined, false, 0, '', 'class2')).toBe('class1 class2');
    });

    it('should handle a mix of complex inputs', () => {
        expect(
            cn(
                'base',
                ['array-class1', 'array-class2'],
                { 'obj-class1': true, 'obj-class2': false },
                null,
                'p-4 text-center',
                'p-8 text-left'
            )
        ).toBe('base array-class1 array-class2 obj-class1 p-8 text-left');
    });
});
