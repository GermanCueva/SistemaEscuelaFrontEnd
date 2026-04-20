import { Button } from 'react-daisyui'
import { Link } from 'react-router-dom';
import milogo from '../lupa.png'
import { ButtonGroup }  from 'react-daisyui';

const ItemPersona = ( {apellido, nombre} ) => {

//console.log({apellido})
//Card del Producto
    return (
   <>      
 
         <tr class="px-6 py-4 padding-top: 1px padding-bottom: 1px odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700 padding:2px line-height: 1.2">
                <td  align="left"> {/*class="px-6 py-4 column-fill: ballance(default) | auto margin-left: 5px  width: 20% column-style: auto" */}
                    {apellido}
                </td>
                <td align="left"> {/*class="px-6 py-4">*/}
                    {nombre}
                </td>
                <td align="left" class="column-style: auto position: 10px">
          <Link to={'/item/'}>
<button class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
  <img 
    src={milogo}
    alt="Icono" 
    className="w-6 h-6 object-contain" 
  />
</button>
 </Link>
          </td> 
            </tr>
 


      
  </>

    )
  }

  export default ItemPersona