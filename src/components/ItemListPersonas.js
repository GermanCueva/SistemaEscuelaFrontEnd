import ItemPersona from './ItemPersona'
//import Spinner from './Spinner'

//Recorro los productos y llamo al componente Item
const ItemListPersona = ( {prods}) => {
    return ( 

      
      
      <div>

<table class="px-12 py-3 table-auto width: 100% w-full ">
<thead class="border=2 text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">  
<tr  class="px-12 py-3 odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">

        <td align="left" class="px-12 py-3"> 
          <strong>Apellido</strong>
        </td>
        <td align="left" class="px-12 py-3"> 
          <strong>Nombre</strong>
        </td>
 </tr>

        

        { prods.length ? (prods.map( p =>
          <ItemPersona apellido={p.apellidos} nombre={p.nombres} />)) : ( <h1>No hay datos</h1> )  
        }
            </thead>
            </table>

      </div>
    )
  }
  
  export default ItemListPersona