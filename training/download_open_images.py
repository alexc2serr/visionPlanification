import argparse
import os
import sys

# Clases exactas validadas de Open Images V7
CLASS_MAPPING = {
    'cajonera': ['Filing cabinet'],
    'casco_de_moto': ['Helmet', 'Bicycle helmet', 'Football helmet'],
    'mochila': ['Backpack'],
    'pantalla': ['Computer monitor', 'Television'],
    'portatil': ['Laptop'],
    'silla_oficina': ['Chair'],
    'mesa_escritorio': ['Desk', 'Table'],
    'separador': ['Shelf', 'Furniture']
}

ALL_OI_CLASSES = []
for oi_classes in CLASS_MAPPING.values():
    ALL_OI_CLASSES.extend(oi_classes)
ALL_OI_CLASSES = sorted(list(set(ALL_OI_CLASSES)))

OI_TO_CUSTOM = {}
for custom_name, oi_classes in CLASS_MAPPING.items():
    for oi_class in oi_classes:
        OI_TO_CUSTOM[oi_class.lower()] = custom_name

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--max-samples', type=int, default=15)
    parser.add_argument('--split', default='validation')
    parser.add_argument('--output-dir', default='C:/VPlan/dataset')
    args = parser.parse_args()

    import fiftyone as fo
    import fiftyone.zoo as foz

    print('=' * 60)
    print('Descargando Google Open Images V7...')
    print(f'Clases objetivo: {ALL_OI_CLASSES}')
    print(f'Split: {args.split}')
    print(f'Max muestras: {args.max_samples}')
    print('=' * 60)

    dataset_name = f'visionplan_{args.split}'
    if fo.dataset_exists(dataset_name):
        fo.delete_dataset(dataset_name)

    dataset = foz.load_zoo_dataset(
        'open-images-v7',
        split=args.split,
        label_types=['detections'],
        classes=ALL_OI_CLASSES,
        max_samples=args.max_samples * len(ALL_OI_CLASSES),
        dataset_name=dataset_name
    )
    print(f'Descargadas {len(dataset)} imagenes.')

    # El campo de detecciones en Open Images v7 es 'ground_truth'
    print('Remapeando etiquetas a nuestras clases...')
    remapped_count = 0
    for sample in dataset.iter_samples(autosave=True):
        if getattr(sample, 'ground_truth', None) is None:
            continue
        new_dets = []
        for det in sample.ground_truth.detections:
            lbl = det.label.lower()
            if lbl in OI_TO_CUSTOM:
                det.label = OI_TO_CUSTOM[lbl]
                new_dets.append(det)
                remapped_count += 1
        sample.ground_truth.detections = new_dets

    print(f'Anotaciones remapeadas: {remapped_count}')

    custom_classes = list(CLASS_MAPPING.keys())
    export_dir = os.path.join(args.output_dir, 'yolo_dataset')
    print(f'Exportando a YOLO en: {export_dir}')

    dataset.export(
        export_dir=export_dir,
        dataset_type=fo.types.YOLOv5Dataset,
        label_field='ground_truth',
        classes=custom_classes
    )
    print('=' * 60)
    print('¡Dataset exportado exitosamente!')
    print(f'Ruta: {export_dir}')
    print('=' * 60)

if __name__ == '__main__':
    main()
