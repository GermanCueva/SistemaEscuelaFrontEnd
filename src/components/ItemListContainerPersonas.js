import { useEffect, useState } from "react"
//import { useParams } from "react-router-dom"
import ItemListPersonas from './ItemListPersonas'
//import productosJson from "../productos.json";
import { Button } from "react-daisyui"

const ItemListContainerPersona = () => {

  const [prods, setProds] = useState([])
  const [texto, setTexto] = useState('')

  //const { categoryId } = useParams()


  useEffect(() => {     

 //   const fetchUserData = () => {
  fetch(`http://localhost:8080/api/persons`)
  .then(response => {
          return response.json()
        })
        .then(data => {
          setProds(data)
        })
    }, []);


    const  handleInputChange = ({target}) => {
       setTexto(target.value)
    }

    function conFiltro(texto){     
      //   const fetchUserData = () => {
        
           fetch(`http://localhost:8080/api/personsconfiltro/${texto}`)
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
        
      const handleSubmit = (e) => {
        e.preventDefault()
        conFiltro(texto)      
      }

    return (
      <>
        <div className="container"> 
        <br></br>   
        <div><strong>Listado de Personas</strong></div>
          <br></br>
        <form onSubmit={handleSubmit}>
        <h3> Filtar por Apellido: <input type="text" id="apellido" name="apellido" value={texto} onChange={handleInputChange}  /> <Button> Filtrar</Button> </h3> 
          <ItemListPersonas prods={prods}/>
          <br></br>  <br></br> 
        </form>
        </div>
      </>
    )
  }
  export default ItemListContainerPersona
