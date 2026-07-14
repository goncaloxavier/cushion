import {useCallback} from 'react'
import {Box, Card, Flex, Label, Select, Stack, TextArea} from '@sanity/ui'
import {
  PatchEvent,
  set,
  setIfMissing,
  unset,
  type ObjectInputProps,
} from 'sanity'

type LocalizedStyledText = {
  _type?: string
  pt?: string
  en?: string
  es?: string
  translationHash?: string
  fontFamily?: 'space-grotesk' | 'inter' | 'arial' | 'georgia' | 'times-new-roman'
  fontSize?: number
  fontWeight?: 'regular' | 'medium' | 'semibold' | 'bold'
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: 'compact' | 'normal' | 'relaxed'
}

const fontOptions = [
  {value: '', label: 'Original'},
  {value: 'space-grotesk', label: 'Space Grotesk'},
  {value: 'inter', label: 'Inter'},
  {value: 'arial', label: 'Arial'},
  {value: 'georgia', label: 'Georgia'},
  {value: 'times-new-roman', label: 'Times New Roman'},
]

const sizeOptions = [12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72]

const weightOptions = [
  {value: '', label: 'Original'},
  {value: 'regular', label: 'Regular'},
  {value: 'medium', label: 'Médio'},
  {value: 'semibold', label: 'Semibold'},
  {value: 'bold', label: 'Negrito'},
]

const alignmentOptions = [
  {value: '', label: 'Original'},
  {value: 'left', label: 'Esquerda'},
  {value: 'center', label: 'Centro'},
  {value: 'right', label: 'Direita'},
]

const lineHeightOptions = [
  {value: '', label: 'Original'},
  {value: 'compact', label: 'Compacto'},
  {value: 'normal', label: 'Normal'},
  {value: 'relaxed', label: 'Aberto'},
]

type SelectField =
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'textAlign'
  | 'lineHeight'

const previewFontFamily: Record<NonNullable<LocalizedStyledText['fontFamily']>, string> = {
  'space-grotesk': "'Space Grotesk', sans-serif",
  inter: 'Inter, sans-serif',
  arial: 'Arial, sans-serif',
  georgia: 'Georgia, serif',
  'times-new-roman': "'Times New Roman', serif",
}

const previewLineHeight: Record<NonNullable<LocalizedStyledText['lineHeight']>, number> = {
  compact: 1.2,
  normal: 1.5,
  relaxed: 1.8,
}

export function LocalizedTextInput(props: ObjectInputProps<LocalizedStyledText>) {
  const {onChange, readOnly, schemaType, value} = props
  const isLongText = schemaType.name === 'localizedText'

  const patchField = useCallback(
    (field: 'pt' | SelectField, nextValue: string | number) => {
      onChange(
        PatchEvent.from([
          setIfMissing({_type: schemaType.name}),
          nextValue === '' ? unset([field]) : set(nextValue, [field]),
        ]),
      )
    },
    [onChange, schemaType.name],
  )

  const textStyle = {
    fontFamily: value?.fontFamily ? previewFontFamily[value.fontFamily] : undefined,
    fontSize: value?.fontSize ? `${value.fontSize}px` : undefined,
    fontWeight: value?.fontWeight,
    textAlign: value?.textAlign,
    lineHeight: value?.lineHeight ? previewLineHeight[value.lineHeight] : undefined,
  }

  return (
    <Card border radius={2} overflow="hidden">
      <Box padding={2}>
        <TextArea
          rows={isLongText ? 7 : 2}
          value={value?.pt ?? ''}
          readOnly={readOnly}
          style={textStyle}
          onChange={(event) => patchField('pt', event.currentTarget.value)}
        />
      </Box>

      <Card borderTop padding={2} tone="transparent">
        <Flex align="flex-end" gap={2} wrap="wrap">
          <Stack space={2} style={{flex: '1 1 180px'}}>
            <Label muted size={1}>Fonte</Label>
            <Select
              disabled={readOnly}
              value={value?.fontFamily ?? ''}
              onChange={(event) => patchField('fontFamily', event.currentTarget.value)}
            >
              {fontOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Stack>

          <Stack space={2} style={{flex: '0 1 100px'}}>
            <Label muted size={1}>Tamanho</Label>
            <Select
              disabled={readOnly}
              value={value?.fontSize ? String(value.fontSize) : ''}
              onChange={(event) =>
                patchField(
                  'fontSize',
                  event.currentTarget.value ? Number(event.currentTarget.value) : '',
                )
              }
            >
              <option value="">Original</option>
              {sizeOptions.map((size) => (
                <option key={size} value={size}>{size} px</option>
              ))}
            </Select>
          </Stack>

          <Stack space={2} style={{flex: '1 1 130px'}}>
            <Label muted size={1}>Peso</Label>
            <Select
              disabled={readOnly}
              value={value?.fontWeight ?? ''}
              onChange={(event) => patchField('fontWeight', event.currentTarget.value)}
            >
              {weightOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Stack>

          <Stack space={2} style={{flex: '1 1 130px'}}>
            <Label muted size={1}>Alinhar</Label>
            <Select
              disabled={readOnly}
              value={value?.textAlign ?? ''}
              onChange={(event) => patchField('textAlign', event.currentTarget.value)}
            >
              {alignmentOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Stack>

          <Stack space={2} style={{flex: '1 1 120px'}}>
            <Label muted size={1}>Linhas</Label>
            <Select
              disabled={readOnly}
              value={value?.lineHeight ?? ''}
              onChange={(event) => patchField('lineHeight', event.currentTarget.value)}
            >
              {lineHeightOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Stack>
        </Flex>
      </Card>
    </Card>
  )
}
