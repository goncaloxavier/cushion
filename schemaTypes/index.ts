import {siteLanding} from './siteLanding'
import {blogPost} from './blogPost'
import {caseStudy} from './caseStudy'
import {billingDetail} from './objects/billingDetail'
import {contentCard} from './objects/contentCard'
import {localizedArticle} from './objects/localizedArticle'
import {localizedString} from './objects/localizedString'
import {localizedText} from './objects/localizedText'
import {downloadItem} from './objects/downloadItem'
import {partnerItem} from './objects/partnerItem'
import {productCategory} from './productCategory'
import {storeProduct} from './storeProduct'
import {storeCategory} from './storeCategory'
import {sitePage} from './sitePage'
import {builderObjectTypes} from './builder/builderObjects'
import {builderSectionTypes} from './builder/builderSections'
import {builderPage} from './builder/builderPage'
import {builderSiteSettings} from './builder/builderSiteSettings'

export const websiteSchemaTypes = [
  siteLanding,
  productCategory,
  storeCategory,
  storeProduct,
  caseStudy,
  blogPost,
  sitePage,
  localizedArticle,
  localizedString,
  localizedText,
  downloadItem,
  partnerItem,
  contentCard,
  billingDetail,
  ...builderObjectTypes,
  ...builderSectionTypes,
  builderPage,
  builderSiteSettings,
]

export const schemaTypes = websiteSchemaTypes
