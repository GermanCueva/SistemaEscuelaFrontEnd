import { useCallback, useEffect, useState } from "react"
import ItemListPersonas from './ItemListPersonas'
import { Button } from "react-daisyui"

const ItemListContainerPersona = () => {

  const [prods, setProds] = useState([])
  const [texto, setTexto] = useState('')


  const token = localStorage.getItem('token');

const obtenerDatos = useCallback(() => {
  fetch(`${process.env.REACT_APP_API_URL}/api/persons`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    }
  })
  .then(response => response.json())
  .then(data => setProds(data));
}, [token]); // <--- Agregas 'token' como dependencia

  useEffect(() => {     
     obtenerDatos()
    }, [obtenerDatos]);


    const  handleInputChange = ({target}) => {
       setTexto(target.value)
       conFiltro(target.value);
    }

    function conFiltro(texto){     
      if(texto === '' || texto === "")
          fetch(`${process.env.REACT_APP_API_URL}/api/persons`, 
      {
      // 👇 AQUÍ AGREGAMOS LA CONFIGURACIÓN CON LOS HEADERS
      method: 'GET', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Le pasamos el token de la línea 13
      }
    })
      else
           fetch(`${process.env.REACT_APP_API_URL}/api/personsconfiltro/apellido/${texto}`, 
      {
      // 👇 AQUÍ AGREGAMOS LA CONFIGURACIÓN CON LOS HEADERS
      method: 'GET', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Le pasamos el token de la línea 13
      }
    })

             .then(response => {
               return response.json()
             })
             .then(data => {
              if(data)
               setProds(data)
              else 
                 return null
   
             })
         }
        
    return (
      <>
        <div className="container"> 
        <br></br>   
        <div><strong>Listado de Personas</strong></div>
          <br></br>
      {/* <form onSubmit={handleSubmit}>*/}
          <form onChange={handleInputChange} onSubmit={(e) => e.preventDefault()}>
            <h3> Filtar por Apellido: <input type="text" id="apellido" name="apellido" value={texto} onChange={handleInputChange}  /> <Button> Filtrar</Button> </h3> 
            <ItemListPersonas prods={prods} setProds={setProds}/>
            <br></br>  <br></br> 
          </form>
        </div>
      </>
    )
  }
  export default ItemListContainerPersona
