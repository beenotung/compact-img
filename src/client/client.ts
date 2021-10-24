let w = window as any;
let canvas = document.createElement('canvas');
canvas.style.display = 'none';
document.body.append(canvas);
let ctx = canvas.getContext('2d');
let statusTextarea = document.getElementById('status') as HTMLTextAreaElement;
let dirInput = document.getElementById('dir') as HTMLInputElement;
w.handleInput = (event: Event) => {
  let maxSize = (document.getElementById('size') as HTMLInputElement).valueAsNumber;
  let sizeUnit = (document.getElementById('unit') as HTMLInputElement).value;
  let dir = (dirInput).value;
  console.log('max size:', maxSize, sizeUnit);
  switch (sizeUnit) {
    case 'KB':
      maxSize *= 1024;
      break;
    case 'MB':
      maxSize *= 1024 / 1024;
      break;
    default:
      console.warn('failed to get size unit, using bytes as fallback unit');
      break;
  }
  let input = event.target as HTMLInputElement;
  let files = input.files;
  let nDone = 0;
  for (let i = 0; i < files.length; i++) {
    let file = files.item(i);
    let fileType = file.type;
    let ss = file.name.split('.');
    let ext = ss.pop();
    let filename = ss.join('.') + '_min.' + ext;
    console.log('compacting', filename);
    let reader = new FileReader();
    reader.onload = () => {
      let img = new Image();
      img.style.display = 'none';
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        let link = document.createElement('a');
        link.setAttribute('download', filename);
        let mimeType: string;
        let byteString: string;
        for (; ;) {
          // example: data:image/png;base64,iVBORw0K...
          let dataUrl = canvas.toDataURL(fileType);
          let metaIdx = dataUrl.indexOf(',');
          if (metaIdx === -1) {
            throw new Error('meta index not found in dataUrl');
          }
          mimeType = dataUrl.slice(0, metaIdx).replace(/^data:/, '');
          byteString = dataUrl.slice(metaIdx + 1);
          if (mimeType.endsWith(';base64')) {
            mimeType = mimeType.replace(/;base64$/, '');
            byteString = atob(byteString);
          } else {
            byteString = unescape(byteString);
          }
          console.log('size:', byteString.length.toLocaleString());
          if (byteString.length <= maxSize) {
            break;
          }
          let ratio = Math.sqrt(maxSize / byteString.length);
          let newWidth = Math.round(canvas.width * ratio);
          let newHeight = Math.round(canvas.height * ratio);
          if (newWidth === canvas.width && newHeight === canvas.height) {
            break;
          }
          canvas.width = newWidth;
          canvas.height = newHeight;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        }
        fetch('/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file: {
              originalname: filename,
              encoding: 'base64',
              mimetype: mimeType,
              content: btoa(byteString),
              size: byteString.length,
            },
            dir,
          }),
        })
          .then(res => {
            if (200 <= res.status && res.status < 300) {
              console.log('saved', filename);
              return;
            }
            console.error('failed to save', filename, 'Reason:', res.status, res.statusText);
          })
          .catch(e => {
            console.error('failed to upload', filename, 'Error:', e);
          })
          .then(() => {
            nDone++;
            statusTextarea.value = `${nDone}/${files.length} (${Math.round(nDone / files.length * 100)}%)`;
          })
        ;
        // let objectUrl = URL.createObjectURL(blob);
        // document.body.append(link);
        // link.setAttribute('href', objectUrl);
        // link.click();
      };
      img.src = reader.result as string;
      document.body.append(img);
    };
    reader.readAsDataURL(file);
  }
};
let callApi = (args: { url: string, doneMessage: string, action: string, body?: string }) =>
  fetch(args.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: args.body,
  })
    .then(res => {
      if (200 <= res.status && res.status < 300) {
        console.log(args.doneMessage);
        statusTextarea.value = args.doneMessage;
        window.close();
        return;
      }
      res.json()
        .then(x => x.message)
        .catch(() => res.statusText)
        .then(msg => statusTextarea.value = msg)
      ;
    })
    .catch(e => {
      console.error('failed to connect to server, Error:', e);
      statusTextarea.value = `failed to connect to server, ${e.toString()}`;
    })
;
w.openDir = () => callApi({
  url: '/open',
  doneMessage: 'opened output directory',
  action: 'open output directory',
  body: JSON.stringify({ dir: dirInput.value }),
});
w.quit = () => callApi({
  url: '/close',
  doneMessage: 'server closed',
  action: 'close server',
});
