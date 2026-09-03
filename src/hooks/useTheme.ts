import { useState, useCallback } from "react";

export function useTheme() {
    const [theme, setTheme] = useState<"light" | "dark">(() => {
        if (typeof window !== "undefined") {
            return (
                (document.documentElement.getAttribute("data-theme") as
                    | "light"
                    | "dark") || "dark"
            );
        }
        return "dark";
    });

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
