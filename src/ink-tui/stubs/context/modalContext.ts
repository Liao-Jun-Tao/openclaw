import { createContext, useContext } from "react";

type ModalContext = {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const ModalCtx = createContext<ModalContext>({
  isModalOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export const ModalProvider = ModalCtx.Provider;
export function useModal(): ModalContext {
  return useContext(ModalCtx);
}
