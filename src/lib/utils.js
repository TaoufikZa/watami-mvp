import { clsx } from "clsx";

export function cn(...inputs) {
    return clsx(inputs);
}

export const formatPrice = (price) => {
    return new Intl.NumberFormat('en-MA', {
        style: 'currency',
        currency: 'MAD',
        minimumFractionDigits: 0,
    }).format(price);
};
