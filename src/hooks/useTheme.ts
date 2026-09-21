import { useState, useCallback, useEffect } from "react";

export function useTheme() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");

    useEffect(() => {
        const current = document.documentElement.getAttribute("data-theme") as "light" | "dark" | null;
        if (current && (current === "light" || current === "dark")) {
            setTheme(current);
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme((prev) => {
            const next = prev === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("kursi-theme", next);
            return next;
        });
    }, []);

    return { theme, toggleTheme };
}
