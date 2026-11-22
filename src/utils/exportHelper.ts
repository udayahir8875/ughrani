import { Platform, Share, Linking } from 'react-native';

export function downloadFile(content: string, filename: string, mimeType: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // Native Mobile Fallback: System Share Sheet
    Share.share({
      title: filename,
      message: content,
    }).catch((err) => console.log('Share error:', err));
  }
}

export function openGoogleDrive() {
  const gdriveUrl = 'https://drive.google.com/drive/my-drive';
  Linking.openURL(gdriveUrl).catch(() => {
    alert('Please open Google Drive app or drive.google.com in browser.');
  });
}
