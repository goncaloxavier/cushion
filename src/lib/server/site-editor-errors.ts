export class SiteEditorDuplicateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteEditorDuplicateError'
  }
}

export class SiteEditorValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SiteEditorValidationError'
  }
}

export class SiteEditorCategoryInUseError extends Error {
  readonly productTitles: string[]

  constructor(productTitles: string[]) {
    const count = productTitles.length
    super(
      count === 1
        ? `Esta categoria ainda é usada por “${productTitles[0]}”. Mova o produto para outra categoria antes de eliminar.`
        : `Esta categoria ainda é usada por ${count} produtos. Mova-os para outra categoria antes de eliminar.`,
    )
    this.name = 'SiteEditorCategoryInUseError'
    this.productTitles = productTitles
  }
}
