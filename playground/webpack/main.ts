import { bar } from './bar'
const foo = () => bar('foo')
foo()

document.getElementById('app')!.innerHTML = '__UNPLUGIN__'
