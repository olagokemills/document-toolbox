import { useState } from 'react'
import type {
  AdjustImagesOptions, BlurImageOptions, CompressImagesOptions, ConvertImagesOptions,
  CropImageOptions, MemeOptions, ResizeImagesOptions, RotateImagesOptions, WatermarkImagesOptions,
} from '@private-pdf/shared-types'
import { DropZone } from '../components/DropZone'
import { ProcessingButton } from '../components/ProcessingButton'
import { ResultBox, ToolHeader } from '../pages/BaseTool'
import type { IpcResult } from '../env.d'
import styles from '../styles/tool.module.css'

const CONFIG: Record<string, { title: string; description: string; color: string; multiple: boolean }> = {
  compress: { title: 'Compress Images', description: 'Reduce image sizes while preserving dimensions.', color: '#e8445a', multiple: true },
  resize: { title: 'Resize Images', description: 'Resize JPG, PNG, and WebP images.', color: '#2d7ef0', multiple: true },
  crop: { title: 'Crop Image', description: 'Crop one image using pixel coordinates.', color: '#e87d2a', multiple: false },
  rotate: { title: 'Rotate & Flip Images', description: 'Rotate or flip images in bulk.', color: '#0eadb0', multiple: true },
  convert: { title: 'Convert Image Format', description: 'Convert between JPG, PNG, and WebP.', color: '#8a5ae8', multiple: true },
  'remove-metadata': { title: 'Remove Image Metadata', description: 'Remove common EXIF, GPS, and camera metadata.', color: '#17a65e', multiple: true },
  watermark: { title: 'Watermark Images', description: 'Apply a text or image watermark.', color: '#c99b14', multiple: true },
  blur: { title: 'Blur or Pixelate', description: 'Hide selected rectangular areas manually.', color: '#d94da6', multiple: false },
  meme: { title: 'Meme Maker', description: 'Add top and bottom captions.', color: '#c75c1e', multiple: false },
  adjust: { title: 'Adjust Images', description: 'Tune brightness, contrast, color, and sharpness.', color: '#1a7a4a', multiple: true },
}

export function ImageTool({ operation, onBack }: { operation: string; onBack: () => void }) {
  const config = CONFIG[operation]
  const [handles, setHandles] = useState<string[]>([])
  const [names, setNames] = useState<string[]>([])
  const [watermarkHandle, setWatermarkHandle] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IpcResult | null>(null)
  const [values, setValues] = useState<Record<string, string | boolean>>({})

  function value(name: string, fallback: string): string { return String(values[name] ?? fallback) }
  function checked(name: string, fallback = false): boolean { return Boolean(values[name] ?? fallback) }
  function update(name: string, next: string | boolean) { setValues((current) => ({ ...current, [name]: next })) }

  async function process() {
    setLoading(true); setResult(null)
    try {
      let response: IpcResult
      switch (operation) {
        case 'compress': response = await window.privatePdf.compressImages(handles, { preset: value('preset', 'balanced') } as CompressImagesOptions); break
        case 'resize': response = await window.privatePdf.resizeImages(handles, { mode: value('mode', 'pixels'), width: Number(value('width', '1200')) || undefined, height: Number(value('height', '0')) || undefined, percentage: Number(value('percentage', '50')), fit: 'inside', maintainAspectRatio: checked('aspect', true), withoutEnlargement: checked('noEnlarge', true) } as ResizeImagesOptions); break
        case 'crop': response = await window.privatePdf.cropImage(handles[0], { left: Number(value('left', '0')), top: Number(value('top', '0')), width: Number(value('width', '400')), height: Number(value('height', '300')) } as CropImageOptions); break
        case 'rotate': response = await window.privatePdf.rotateImages(handles, { angle: Number(value('angle', '90')), flipHorizontal: checked('flipHorizontal'), flipVertical: checked('flipVertical'), applyTo: value('applyTo', 'all') } as RotateImagesOptions); break
        case 'convert': response = await window.privatePdf.convertImages(handles, { format: value('format', 'jpeg'), quality: Number(value('quality', '85')), background: value('background', '#ffffff') } as ConvertImagesOptions); break
        case 'remove-metadata': response = await window.privatePdf.removeImageMetadata(handles); break
        case 'watermark': response = await window.privatePdf.watermarkImages(handles, { kind: value('kind', 'text'), text: value('text', 'PRIVATE'), position: value('position', 'center'), opacity: Number(value('opacity', '0.5')), scale: Number(value('scale', '0.3')), color: value('color', '#ffffff'), fontSize: Number(value('fontSize', '32')), repeat: checked('repeat') } as WatermarkImagesOptions, watermarkHandle); break
        case 'blur': response = await window.privatePdf.blurImageAreas(handles[0], { mode: value('mode', 'blur'), intensity: Number(value('intensity', '8')), areas: value('areas', '').split(';').filter(Boolean).map((area) => { const [left, top, width, height] = area.split(',').map(Number); return { left, top, width, height } }) } as BlurImageOptions); break
        case 'meme': response = await window.privatePdf.createMeme(handles[0], { topText: value('topText', ''), bottomText: value('bottomText', ''), placement: value('placement', 'inside'), fontSize: Number(value('fontSize', '42')), color: value('color', '#ffffff'), background: value('background', '#000000') } as MemeOptions); break
        default: response = await window.privatePdf.adjustImages(handles, { brightness: Number(value('brightness', '1')), contrast: Number(value('contrast', '1')), saturation: Number(value('saturation', '1')), grayscale: checked('grayscale'), sepia: checked('sepia'), sharpen: Number(value('sharpen', '0')), autoOrient: checked('autoOrient', true) } as AdjustImagesOptions)
      }
      setResult(response)
    } catch { setResult({ ok: false, error: 'We could not process these images. Your files were not uploaded anywhere.' }) }
    finally { setLoading(false) }
  }

  const input = (name: string, label: string, fallback: string, type = 'number') => <label className={styles.field}>{label}<input className={styles.input} type={type} value={value(name, fallback)} onChange={(event) => update(name, event.target.value)} /></label>
  const select = (name: string, label: string, options: Array<[string,string]>, fallback: string) => <label className={styles.field}>{label}<select className={styles.input} value={value(name, fallback)} onChange={(event) => update(name, event.target.value)}>{options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label>
  const check = (name: string, label: string, fallback = false) => <label><input type="checkbox" checked={checked(name, fallback)} onChange={(event) => update(name, event.target.checked)} /> {label}</label>

  return <div className={styles.page} style={{ '--tool-color': config.color } as React.CSSProperties}>
    <ToolHeader title={config.title} description={config.description} color={config.color} onBack={onBack} />
    <DropZone accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple={config.multiple} label="Drop JPG, PNG, or WebP images here" onFiles={(paths, nextNames) => { setHandles(config.multiple ? paths : paths.slice(0,1)); setNames(config.multiple ? nextNames : nextNames.slice(0,1)); setResult(null) }} />
    {names.length > 0 && <p className={styles.selectedFile}>{names.join(', ')}</p>}
    <div className={styles.fieldset}>
      {operation === 'compress' && select('preset','Compression preset',[['high-quality','High Quality'],['balanced','Balanced'],['smallest','Smallest Size']],'balanced')}
      {operation === 'resize' && <>{select('mode','Mode',[['pixels','Pixels'],['percentage','Percentage']],'pixels')}{input('width','Width','1200')}{input('height','Height','0')}{input('percentage','Percentage','50')}{check('aspect','Maintain aspect ratio',true)}{check('noEnlarge','Do not enlarge',true)}</>}
      {operation === 'crop' && <>{input('left','Left','0')}{input('top','Top','0')}{input('width','Width','400')}{input('height','Height','300')}</>}
      {operation === 'rotate' && <>{select('angle','Rotation',[['0','None'],['90','90° right'],['180','180°'],['270','90° left']],'90')}{select('applyTo','Apply to',[['all','All'],['portrait','Portrait'],['landscape','Landscape']],'all')}{check('flipHorizontal','Flip horizontally')}{check('flipVertical','Flip vertically')}</>}
      {operation === 'convert' && <>{select('format','Output format',[['jpeg','JPG'],['png','PNG'],['webp','WebP']],'jpeg')}{input('quality','Quality','85')}{input('background','JPG background','#ffffff','color')}</>}
      {operation === 'remove-metadata' && <p>Removes common EXIF, GPS, camera, and comment metadata while preserving visible pixels.</p>}
      {operation === 'watermark' && <>{select('kind','Type',[['text','Text'],['image','Image']],'text')}{input('text','Text','PRIVATE','text')}{select('position','Position',[['center','Center'],['top-left','Top left'],['top-right','Top right'],['bottom-left','Bottom left'],['bottom-right','Bottom right']],'center')}{input('opacity','Opacity','0.5')}{input('scale','Scale','0.3')}{input('fontSize','Font size','32')}{input('color','Color','#ffffff','color')}{check('repeat','Repeat pattern')}<label className={styles.field}>Watermark image<input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(event) => { const file = event.target.files?.[0]; setWatermarkHandle(file ? window.privatePdf.registerFile(file).handle : undefined) }} /></label></>}
      {operation === 'blur' && <>{select('mode','Effect',[['blur','Blur'],['pixelate','Pixelate']],'blur')}{input('areas','Areas: X,Y,width,height; ...','20,20,200,100','text')}{input('intensity','Intensity','8')}</>}
      {operation === 'meme' && <>{input('topText','Top text','','text')}{input('bottomText','Bottom text','','text')}{select('placement','Placement',[['inside','Inside'],['outside','Outside']],'inside')}{input('fontSize','Font size','42')}{input('color','Text color','#ffffff','color')}{input('background','Background','#000000','color')}</>}
      {operation === 'adjust' && <>{input('brightness','Brightness','1')}{input('contrast','Contrast','1')}{input('saturation','Saturation','1')}{input('sharpen','Sharpen','0')}{check('grayscale','Grayscale')}{check('sepia','Sepia')}{check('autoOrient','Auto-orient',true)}</>}
    </div>
    <ResultBox result={result} error={null} />
    <div className={styles.actions}><ProcessingButton onClick={process} loading={loading} disabled={handles.length === 0} color={config.color}>Process {handles.length > 1 ? `${handles.length} Images` : 'Image'} →</ProcessingButton></div>
  </div>
}
