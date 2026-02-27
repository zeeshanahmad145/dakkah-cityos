import React, { useState } from 'react'

interface MenuItem {
  name: string
  price?: number
  description?: string
  dietary?: string[]
  popular?: boolean
}

interface MenuCategory {
  name: string
  items: MenuItem[]
}

interface MenuDisplayBlockProps {
  heading?: string
  categories?: MenuCategory[]
  variant?: 'grid' | 'list' | 'visual'
  showPrices?: boolean
  showDietaryIcons?: boolean
  currency?: string
}

const defaultCategories: MenuCategory[] = [
  {
    name: 'Starters',
    items: [
      { name: 'Bruschetta', price: 9.5, description: 'Toasted bread with tomatoes, garlic, and basil', dietary: ['vegetarian'], popular: true },
      { name: 'Spring Rolls', price: 8, description: 'Crispy vegetable spring rolls with sweet chili sauce', dietary: ['vegan'] },
      { name: 'Soup of the Day', price: 7, description: 'Freshly prepared daily', dietary: [] },
    ],
  },
  {
    name: 'Main Courses',
    items: [
      { name: 'Grilled Salmon', price: 24, description: 'Atlantic salmon with lemon butter and seasonal vegetables', dietary: [], popular: true },
      { name: 'Mushroom Risotto', price: 18, description: 'Arborio rice with wild mushrooms and parmesan', dietary: ['vegetarian'] },
      { name: 'Steak Frites', price: 28, description: '8oz ribeye with hand-cut fries and béarnaise', dietary: [] },
      { name: 'Veggie Buddha Bowl', price: 16, description: 'Quinoa, roasted vegetables, avocado, and tahini dressing', dietary: ['vegan'], popular: true },
    ],
  },
  {
    name: 'Desserts',
    items: [
      { name: 'Tiramisu', price: 10, description: 'Classic Italian coffee-flavored dessert', dietary: ['vegetarian'] },
      { name: 'Fruit Sorbet', price: 8, description: 'Three scoops of seasonal fruit sorbet', dietary: ['vegan'] },
      { name: 'Chocolate Fondant', price: 12, description: 'Warm chocolate cake with molten center', dietary: ['vegetarian'], popular: true },
    ],
  },
  {
    name: 'Drinks',
    items: [
      { name: 'Fresh Juice', price: 6, description: 'Orange, apple, or carrot', dietary: ['vegan'] },
      { name: 'Craft Lemonade', price: 5, description: 'House-made with fresh lemons and mint', dietary: ['vegan'] },
      { name: 'Espresso', price: 4, description: 'Double shot espresso', dietary: ['vegan'] },
    ],
  },
]

const dietaryLabels: Record<string, string> = {
  vegetarian: '🥬 Vegetarian',
  vegan: '🌱 Vegan',
  'gluten-free': '🌾 Gluten-Free',
  'nut-free': '🥜 Nut-Free',
  halal: '☪ Halal',
  kosher: '✡ Kosher',
}

export const MenuDisplayBlock: React.FC<MenuDisplayBlockProps> = ({
  heading = 'Our Menu',
  categories = defaultCategories,
  variant = 'list',
  showPrices = true,
  showDietaryIcons = true,
  currency = 'USD',
}) => {
  const [activeCategory, setActiveCategory] = useState(0)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(price)
  }

  const currentCategory = categories[activeCategory]

  const renderMenuItem = (item: MenuItem, index: number) => (
    <div
      key={index}
      className={`p-4 rounded-lg border border-ds-border bg-ds-card hover:shadow-sm transition-shadow ${
        variant === 'visual' ? 'flex gap-4' : ''
      }`}
    >
      {variant === 'visual' && (
        <div className="w-20 h-20 bg-ds-muted rounded-lg animate-pulse flex-shrink-0" />
      )}
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-ds-foreground">{item.name}</h4>
            {item.popular && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-ds-primary/10 text-ds-primary">Popular</span>
            )}
          </div>
          {showPrices && item.price !== undefined && (
            <span className="font-semibold text-ds-foreground whitespace-nowrap">{formatPrice(item.price)}</span>
          )}
        </div>
        {item.description && (
          <p className="text-sm text-ds-muted-foreground mb-2">{item.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {showDietaryIcons && item.dietary?.map((d) => (
            <span key={d} className="text-xs text-ds-muted-foreground bg-ds-muted px-2 py-0.5 rounded-full">
              {dietaryLabels[d] || d}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="text-sm px-4 py-1.5 bg-ds-primary text-ds-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
          Add to Order
        </button>
      </div>
    </div>
  )

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-ds-foreground mb-8">{heading}</h2>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-48 flex-shrink-0">
            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
              {categories.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCategory(i)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === i
                      ? 'bg-ds-primary text-ds-primary-foreground'
                      : 'bg-ds-muted text-ds-muted-foreground hover:text-ds-foreground'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-xl font-semibold text-ds-foreground mb-4">{currentCategory?.name}</h3>
            <div className={variant === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'flex flex-col gap-3'}>
              {(currentCategory?.items || []).map((item, i) => renderMenuItem(item, i))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
