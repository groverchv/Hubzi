import os
import sys
import glob
from rembg import remove, new_session
from PIL import Image

def process_folder(folder_path, model_name='isnet-general-use'):
    if not os.path.isdir(folder_path):
        print(f'Error: La carpeta {folder_path} no existe.')
        return
    
    extensions = ('*.jpg', '*.jpeg', '*.png', '*.webp')
    files = []
    for ext in extensions:
        files.extend(glob.glob(os.path.join(folder_path, ext)))
    
    files = [f for f in files if not f.endswith('_clean.png')]
    print(f'Procesando {len(files)} imagenes con {model_name}...')
    
    session = new_session(model_name)
    for idx, fpath in enumerate(files, 1):
        fname = os.path.basename(fpath)
        base, _ = os.path.splitext(fname)
        out_path = os.path.join(folder_path, f'{base}.png')
        print(f'[{idx}/{len(files)}] {fname} -> {base}.png')
        img = Image.open(fpath)
        out = remove(img, session=session)
        bbox = out.getbbox()
        if bbox:
            out = out.crop(bbox)
        out.save(out_path, 'PNG')
    print('Completado!')

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else r'frontend/src/assets/mascots'
    process_folder(target)
