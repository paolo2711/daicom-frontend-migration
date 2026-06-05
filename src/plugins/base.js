import upperFirst from 'lodash/upperFirst'
import camelCase from 'lodash/camelCase'

export default function registerBaseComponents(app) {
    // import.meta.glob es la versión Vite de require.context
    const components = import.meta.glob('@/components/commonComponents/Base*.vue', { eager: true })

    Object.entries(components).forEach(([path, definition]) => {
        const componentName = upperFirst(
            camelCase(
                path.split('/').pop().replace(/\.\w+$/, '')
            )
        )
        app.component(componentName, definition.default)
    })
}