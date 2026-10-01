import { create } from "zustand";
import { useAuthStore } from "@/store/authStore";
import type { ExploreArea, ExploreMode } from "@/types/explore";

export type ManualExploreArea = {
    value: ExploreArea;
    label: string;
};

type ExploreUiState = {
    draft: string;
    submitted: string;
    mode: ExploreMode;
    manualArea: ManualExploreArea | null;
    lastRouteKey: string | null;
    scroll: {
        key: string;
        offset: number;
    } | null;
};

function initialState(): ExploreUiState {
    return {
        draft: "",
        submitted: "",
        mode: "cities",
        manualArea: null,
        lastRouteKey: null,
        scroll: null,
    };
}

export const useExploreUiStore = create<ExploreUiState>(initialState);

useAuthStore.subscribe((current, previous) => {
    if (current.user?.id !== previous.user?.id) {
        useExploreUiStore.setState(initialState());
    }
});
