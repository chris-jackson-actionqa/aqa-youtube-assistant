import { renderHook } from "@testing-library/react";
import useModalKeyboardHandler from "../useModalKeyboardHandler";

describe("useModalKeyboardHandler", () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, "addEventListener");
    removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it("should not add event listener when modal is closed", () => {
    renderHook(() => useModalKeyboardHandler(false, jest.fn()));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("should add keydown event listener when modal is open", () => {
    renderHook(() => useModalKeyboardHandler(true, jest.fn()));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("should call onClose when Escape key is pressed", () => {
    const onClose = jest.fn();
    renderHook(() => useModalKeyboardHandler(true, onClose));

    const keydownEvent = new KeyboardEvent("keydown", { key: "Escape" });
    window.dispatchEvent(keydownEvent);

    expect(onClose).toHaveBeenCalled();
  });

  it("should not call onClose for other keys", () => {
    const onClose = jest.fn();
    renderHook(() => useModalKeyboardHandler(true, onClose));

    const keydownEvent = new KeyboardEvent("keydown", { key: "Enter" });
    window.dispatchEvent(keydownEvent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it("should remove event listener when modal closes", () => {
    const { rerender } = renderHook(
      ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
        useModalKeyboardHandler(isOpen, onClose),
      { initialProps: { isOpen: true, onClose: jest.fn() } }
    );

    rerender({ isOpen: false, onClose: jest.fn() });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("should clean up event listener on unmount", () => {
    const { unmount } = renderHook(() =>
      useModalKeyboardHandler(true, jest.fn())
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );
  });

  it("should update callback when onClose changes", () => {
    const onClose1 = jest.fn();
    const onClose2 = jest.fn();

    const { rerender } = renderHook(
      ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
        useModalKeyboardHandler(isOpen, onClose),
      { initialProps: { isOpen: true, onClose: onClose1 } }
    );

    rerender({ isOpen: true, onClose: onClose2 });

    const keydownEvent = new KeyboardEvent("keydown", { key: "Escape" });
    window.dispatchEvent(keydownEvent);

    expect(onClose1).not.toHaveBeenCalled();
    expect(onClose2).toHaveBeenCalled();
  });
});
