import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { format } from "date-fns";

export function useLocalToday() {
    const [today, setToday] = useState(() => format(new Date(), "yyyy-MM-dd"));

    useEffect(() => {
        const refresh = () => setToday(format(new Date(), "yyyy-MM-dd"));
        const timer = setInterval(refresh, 30_000);
        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") refresh();
        });
        return () => {
            clearInterval(timer);
            sub.remove();
        };
    }, []);
    return today;
}
