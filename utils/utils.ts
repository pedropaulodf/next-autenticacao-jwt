import toast from "react-hot-toast";

export function checkIsBrowser() {
  return typeof window !== "undefined" ? true : false;
}

export function showToast(type: string, message: string, duration = 4_000) {
  
  // Dismiss all toasts before new ones
  toast.dismiss();

  switch (type) {
    case "success":
      toast.success(message, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
        duration,
      });
      break;
    case "error":
      toast.error(message, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
        duration,
      });
      break;

    default:
      toast(message, {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
        duration,
      });
      break;
  }

}
