import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
    });
  },
  error: (message: string) => {
    toast.error(message, {
      duration: 4000,
      position: 'top-center',
    });
  },
  info: (message: string) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      icon: 'ℹ️',
    });
  },
  warning: (message: string) => {
    toast(message, {
      duration: 3000,
      position: 'top-center',
      icon: '⚠️',
    });
  },
};
