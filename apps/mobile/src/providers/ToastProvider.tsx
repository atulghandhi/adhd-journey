import type { PropsWithChildren } from "react";
import {
  useCallback,
  createContext,
  useEffect,
  startTransition,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type ToastTone = "error" | "success";

interface ToastState {
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [translateY] = useState(() => new Animated.Value(120));
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    startTransition(() => {
      setToast({ message, tone });
    });

    translateY.setValue(120);
    Animated.spring(translateY, {
      damping: 18,
      stiffness: 220,
      mass: 0.8,
      toValue: 0,
      useNativeDriver: true,
    }).start();

    dismissTimer.current = setTimeout(() => {
      dismissTimer.current = null;
      Animated.timing(translateY, {
        duration: 200,
        toValue: 120,
        useNativeDriver: true,
      }).start(() => setToast(null));
    }, 3000);
  }, [translateY]);

  const value = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={styles.overlay}>
          <Animated.View
            style={[
              styles.toast,
              toast.tone === "error" ? styles.toastError : styles.toastSuccess,
              { transform: [{ translateY }] },
            ]}
          >
            <Text style={styles.toastText}>{toast.message}</Text>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    bottom: 96,
    left: 16,
    position: "absolute",
    right: 16,
  },
  toast: {
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: "100%",
  },
  toastError: {
    backgroundColor: "#EF4444",
  },
  toastSuccess: {
    backgroundColor: "#1B4332",
  },
  toastSuccessDark: {
    backgroundColor: "#243D2F",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
