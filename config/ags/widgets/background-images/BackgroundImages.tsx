/********************************************************************************************\
|**** As a disclaimer, this widget is built for a private piece of software I developed. ****|
|**** This means you will likely not have much success using it.                         ****|
|**** You could reverse engineer a solution, but I will not provide support for it.      ****|
|**** Perhaps I will make a public version of the private software in the future.        ****|
\********************************************************************************************/

import { App, Astal, Gtk, Gdk } from "astal/gtk4"
import { execAsync, timeout, Variable, bind, AstalIO } from "astal"
import { GLib } from "astal"

interface ICollectionItem {
  id: number
  collectionId: number
  api: string
  md5: string
  tags: string[]
  fileUrl: string
  sampleUrl?: string
  previewUrl?: string
  width: number
  height: number
  type: string
  source?: string
  accepted: boolean
}

export interface BackgroundImageConfig {
  enabled?: boolean
  protocol: "http" | "https"
  serverIp: string
  collections: number[]
  updateIntervalMs: number
  maxImages: number
  opacity: number
  scale: number
  positioning: "grid", // Only grid layout is supported
  bearer: string
}

const defaultConfig: BackgroundImageConfig = {
  enabled: true,
  protocol: "http",
  serverIp: "localhost:3800",
  collections: [],
  updateIntervalMs: 60000, // 1 minute
  maxImages: 4,
  opacity: 0.7,
  scale: 0.3, // 30% of screen size
  positioning: "grid",
  bearer: ""
}

// Store config in a variable that can be updated
const config = Variable<BackgroundImageConfig | null>(null)

// Fetch images from a collection
async function fetchRandomImages(collectionId: number, limit: number = 1): Promise<ICollectionItem[]> {
  try {
    if (!config.get()) {
      return []
    }
    const serverIp = config.get()!.serverIp
    const protocol = config.get()!.protocol
    const url = `${protocol}://${serverIp}/api/collection/${collectionId}/images/accepted?random=true&limit=${limit}`
    
    print("Fetching images from ", url)
    // Use execAsync to run curl command
    
    const response = await execAsync(["curl", "-s", url, "-H", `Authorization: Bearer ${config.get()!.bearer}`])
    if (!response) return []
    
    return JSON.parse(response) as ICollectionItem[]
  } catch (error) {
    console.error(`Failed to fetch images from collection ${collectionId}:`, error)
    return []
  }
}

// Get thumbnail URL for an image
function getImageThumbnailUrl(image: ICollectionItem): string {
  if (!config.get()) {
    return image.previewUrl || ""
  }
  const serverIp = config.get()!.serverIp
  const protocol = config.get()!.protocol
  
  if (image.collectionId) {
    return `${protocol}://${serverIp}/api/collection/${image.collectionId}/image_thumbnail/${image.id}`
  } else {
    return image.previewUrl || ""
  }
}

// Component for a single background image
function createBackgroundImage(image: ICollectionItem): Gtk.Widget {
  const { CENTER, START, END } = Gtk.Align

  if (!config.get()) {
    return Gtk.Label.new("Background images not configured")
  }
  
  // Get positioning based on config
  const scale = config.get()!.scale
  
  // Get the image URL
  const imageUrl = getImageThumbnailUrl(image)
  
  // Build the widget tree
  const imageBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)
  imageBox.get_style_context().add_class("background-image-container")
  
  // For grid layout
  imageBox.set_hexpand(true)
  imageBox.set_halign(Gtk.Align.FILL)
  imageBox.set_valign(CENTER)
  
  // Add CSS styling
  imageBox.set_name(`background-image-${image.id}`)
  const css = `
    .background-image-container {
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 8px;
      padding: 4px;
      margin: 4px;
      border: none;
    }
    
    #background-image-${image.id} .image-wrapper {
      opacity: ${config.get()!.opacity};
    }
    
    #background-image-${image.id} .image-wrapper:hover {
      opacity: 1.0;
      margin: -1px;
    }
    
    #background-image-${image.id} .image-box {
      border-radius: 4px;
      background-color: transparent;
    }

    .background-image {
      transition: opacity 0.3s ease;
      opacity: ${config.get()!.opacity};
    }
    
    #background-image-${image.id} .image-info {
      background-color: rgba(0, 0, 0, 0.6);
      padding: 4px 8px;
      border-radius: 0 0 4px 4px;
      font-size: 10px;
      color: white;
      opacity: 0;
    }
    
    #background-image-${image.id}:hover .image-info {
      opacity: 1;
    }
    
    .tag {
      background-color: rgba(100, 100, 100, 0.7);
      padding: 2px 4px;
      margin: 2px;
      border-radius: 4px;
      font-size: 8px;
      color: white;
      opacity: 0; /* Start hidden */
    }
  `
  
  const provider = Gtk.CssProvider.new()
  provider.load_from_data(css, css.length)
  
  const screen = Gdk.Display.get_default()
  if (screen) {
    Gtk.StyleContext.add_provider_for_display(
      screen,
      provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    )
  }
  
  // Create overlay
  const overlay = Gtk.Overlay.new()
  
  // Create image wrapper
  const imageWrapper = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)
  imageWrapper.get_style_context().add_class("image-wrapper")
  
  // Create image box with background image
  const imageBoxBg = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)
  imageBoxBg.get_style_context().add_class("image-box")
  
  // For GTK3, we'll create an actual Gtk.Image for more reliable image display
  try {
    // Create a GdkPixbuf.Pixbuf from a file or URL
    // Since we can't directly load from URL in GTK3, we'll need to:
    // 1. Download the image with curl (we already have the URL)
    // 2. Create a temporary file path
    const tempFile = `/tmp/booru_img_${image.id}_${Math.random().toString(36).substring(2, 9)}`
    
    // Set a loading indicator first
    const loadingLabel = Gtk.Label.new("Loading...")
    loadingLabel.set_size_request(Math.floor(200 * scale), Math.floor(200 * scale))
    imageBoxBg.add(loadingLabel)
    
    // Start an async process to load the image
    execAsync([
      "curl",
      "-s",
      "-o",
      tempFile,
      imageUrl,
      "-H",
      `Authorization: Bearer ${config.get()!.bearer}`
    ]).then(() => {
      // Remove loading indicator
      imageBoxBg.get_children().forEach(child => {
        imageBoxBg.remove(child)
      })
      
      // Try to create an image from the file
      try {
        const image = Gtk.Image.new_from_file(tempFile)
        image.set_size_request(Math.floor(200 * scale), Math.floor(200 * scale))
        image.get_style_context().add_class("background-image")
        imageBoxBg.add(image)
        imageBoxBg.show_all()
        
        // Schedule cleanup of temp file
        timeout(1000, () => {
          execAsync(["rm", tempFile])
          return false // Don't repeat
        })
      } catch (err) {
        console.error("Failed to load image:", err)
        // Show error state
        const errorLabel = Gtk.Label.new("Error")
        imageBoxBg.add(errorLabel)
        imageBoxBg.show_all()
      }
    }).catch(err => {
      console.error("Failed to download image:", err)
      // Show error state
      imageBoxBg.get_children().forEach(child => {
        imageBoxBg.remove(child)
      })
      const errorLabel = Gtk.Label.new("Error")
      imageBoxBg.add(errorLabel)
      imageBoxBg.show_all()
    })
  } catch (err) {
    console.error("Error setting up image:", err)
  }
  
  imageWrapper.add(imageBoxBg)
  
  // Create info box
  const infoBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)
  infoBox.get_style_context().add_class("image-info")
  infoBox.set_valign(END)
  infoBox.set_halign(START)
  
  // Add API label
  // const apiLabel = Gtk.Label.new(image.api)
  // apiLabel.set_xalign(0)
  // apiLabel.set_line_wrap(true)
  // infoBox.add(apiLabel)
  
  // Add tags box
  const tagsBox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 4)
  
  // Add tags (up to 3)
  image.tags.sort(
    (a, b) => Math.random() - 0.5 // Randomize order for variety
  ).slice(0, 4).forEach(tag => {
    const tagLabel = Gtk.Label.new(tag)
    tagLabel.get_style_context().add_class("tag")
    tagsBox.add(tagLabel)
  })
  
  infoBox.add(tagsBox)
  
  // Add all to overlay
  overlay.add(imageWrapper)
  overlay.add_overlay(infoBox)
  
  // Add overlay to container
  imageBox.add(overlay)
  
  return imageBox
}

// Create grid layout
function createGridLayout(images: ICollectionItem[]): Gtk.Widget {
  // Calculate grid dimensions with 3:2 aspect ratio (width:height)
  const totalImages = images.length
  const aspectRatio = 3 / 2 // 3:2 ratio
  
  // Start with square root and adjust for aspect ratio
  const baseSize = Math.sqrt(totalImages)
  const columns = Math.ceil(baseSize * Math.sqrt(aspectRatio))
  const rows = Math.ceil(totalImages / columns)
  
  // Create a 2D array of images organized by grid position
  const grid: (ICollectionItem | null)[][] = []
  for (let r = 0; r < rows; r++) {
    grid[r] = []
    for (let c = 0; c < columns; c++) {
      const index = r * columns + c
      grid[r][c] = index < images.length ? images[index] : null
    }
  }
  
  // Create container box
  const container = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)
  container.set_halign(Gtk.Align.FILL)
  container.set_valign(Gtk.Align.CENTER)
  container.set_hexpand(true)
  
  // Create flex layout box
  const gridBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 10)
  gridBox.set_hexpand(true)
  gridBox.get_style_context().add_class("grid-layout")
  
  // Add CSS for layout
  const css = `
    .grid-layout {
      padding: 10px;
    }
    .grid-row {
      margin-bottom: 10px;
    }
  `
  
  const provider = Gtk.CssProvider.new()
  provider.load_from_data(css)
  
  const screen = Gdk.Screen.get_default()
  if (screen) {
    Gtk.StyleContext.add_provider_for_screen(
      screen,
      provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    )
  }
  
  // Create rows and add images
  grid.forEach(row => {
    const rowBox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 10)
    rowBox.get_style_context().add_class("grid-row")
    rowBox.set_homogeneous(true) // Make all children have equal width
    rowBox.set_hexpand(true)
    rowBox.set_valign(Gtk.Align.CENTER)
    
    row.forEach(image => {
      if (image) {
        rowBox.add(createBackgroundImage(image))
      } else {
        // Add empty box for missing images to maintain grid structure
        const emptyBox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 0)
        rowBox.add(emptyBox)
      }
    })
    
    gridBox.add(rowBox)
  })
  
  container.add(gridBox)
  
  return container
}

// Background Images component - supports grid layout for displaying images
// The edge and random layouts have been removed, keeping only grid layout for now
// This provides a clean foundation for adding new layouts in the future

function createBackgroundImages(): Gtk.Widget {
  if (!config.get()) {
    return Gtk.Label.new("Background images not configured")
  }
  
  const allImages = Variable<ICollectionItem[]>([])
  const updateIntervalId = Variable<AstalIO.Time | null>(null)
  
  // Function to update images
  async function updateImages() {
    if (!config.get() || config.get()!.enabled === false) {
      allImages.set([])
      return;
    }
    
    const { collections, maxImages } = config.get()!
    
    if (collections.length === 0) {
      allImages.set([])
      return
    }
    
    // Determine how many images to fetch from each collection
    const imagesPerCollection = Math.max(1, Math.floor(maxImages / collections.length) + (maxImages % collections.length))
    
    // Fetch images from all collections
    const fetchPromises = collections.map(collectionId => 
      fetchRandomImages(collectionId, imagesPerCollection)
    )
    
    try {
      const results = await Promise.all(fetchPromises)
      const newImages = results.flat()
      
      // Limit to max images
      const limitedImages = newImages.slice(0, maxImages)
      allImages.set(limitedImages)
    } catch (error) {
      console.error("Failed to update background images:", error)
    }
  }
  
  // Set up recurring updates
  function setupUpdates() {
    if (!config.get()) {
      return;
    }
    
    // Set up interval for updates
    const { updateIntervalMs } = config.get()!
    
    // Set delay of 1 second before first update
    // timeout(1000, () => {

    // });
    // Initial update
    updateImages()

    function _setup() {
      const id = timeout(updateIntervalMs, () => {
        updateImages()
        _setup() // Schedule next update
      })
      
      updateIntervalId.set(id)
    }

    _setup()

  }
  
  config().subscribe(() => {
    // If config changes, clear existing interval
    const id = updateIntervalId.get()
    print("Background image config changed, updating...", id)
    if (id !== null) {
      // GLib.Source.remove(id)
      id.cancel();
      updateIntervalId.set(null)
    }
    
    // Restart updates with new config
    setupUpdates()
  })
  
  // Clean up on destroy
  function cleanup() {
    const id = updateIntervalId.get()
    if (id !== null) {
      // GLib.Source.remove(id)
      id.cancel();
      updateIntervalId.set(null)
    }
  }
  
  setupUpdates()
  
  // Create container box
  const container = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)
  container.set_name("background-images-container")
  container.set_hexpand(true)
  container.set_vexpand(true)
  
  // Add CSS
  const css = `
    #background-images-container {
      background-color: transparent;
    }
    
    .background-image-container {
      /* Empty but kept for selector */
    }
  `
  
  const provider = Gtk.CssProvider.new()
  provider.load_from_data(css)
  
  const screen = Gdk.Screen.get_default()
  if (screen) {
    Gtk.StyleContext.add_provider_for_screen(
      screen,
      provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    )
  }
  
  // Connect destroy signal
  container.connect("destroy", cleanup)
  
  // Create update function to update the UI when images change
  function update() {
    if (!config.get()) {
      return
    }
    
    // Clear container
    container.get_children().forEach(child => {
      container.remove(child)
    })
    
    const images = allImages.get()
    
    // Add images
    if (images.length === 0) {
      const emptyBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0)
      container.add(emptyBox)
    } else {
      // Always use grid layout
      container.add(createGridLayout(images))
    }
    
    container.show_all()
  }
  
  // Do initial update
  updateImages().then(update)
  
  // Set up a callback for when allImages changes
  allImages.set = function(newValue) {
    Variable.prototype.set.call(this, newValue)
    update()
  }
  
  return container
}

// Main export for use in app.ts
export default function(config?: BackgroundImageConfig) {
  // Update the config variable
  updateConfig(config ?? {})
  return createBackgroundImages()
}

// Update the configuration
export function updateConfig(newConfig: Partial<BackgroundImageConfig>) {
  if (config.get()) {
    config.set({
      ...config.get()!,
      ...newConfig
    })
  }
  else {
    config.set({
      ...defaultConfig,
      ...newConfig
    })
  }
}
