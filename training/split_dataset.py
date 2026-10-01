import os
import shutil
from pathlib import Path

base = Path(r'C:\VPlan\dataset\yolo_dataset')
img_val = base / 'images' / 'val'
lbl_val = base / 'labels' / 'val'

img_train = base / 'images' / 'train'
lbl_train = base / 'labels' / 'train'
img_train.mkdir(parents=True, exist_ok=True)
lbl_train.mkdir(parents=True, exist_ok=True)

images = sorted(list(img_val.glob('*.jpg')))
split_idx = int(len(images) * 0.75)

for img in images[:split_idx]:
    shutil.move(str(img), str(img_train / img.name))
    txt_name = img.stem + '.txt'
    txt_file = lbl_val / txt_name
    if txt_file.exists():
        shutil.move(str(txt_file), str(lbl_train / txt_name))

yaml_content = f'''path: {base.resolve()}
train: images/train
val: images/val

names:
  0: cajonera
  1: casco_de_moto
  2: mochila
  3: pantalla
  4: portatil
  5: silla_oficina
  6: mesa_escritorio
  7: separador
'''

(base / 'dataset.yaml').write_text(yaml_content, encoding='utf-8')
n_train = len(list(img_train.glob('*.jpg')))
n_val = len(list(img_val.glob('*.jpg')))
print('Train imagenes: ' + str(n_train))
print('Val imagenes: ' + str(n_val))
