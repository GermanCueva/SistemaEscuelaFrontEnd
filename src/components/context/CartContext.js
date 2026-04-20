import { useState } from "react"
import React from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const CartContext = React.createContext([])

export default CartContext


const CartProvider = ({defaultValue=[], children}) => {

    const [items, setItems] = useState(defaultValue)
    const [cantidadactual, setCantidad] = useState(0)

    const addItem = async (item, quantity) => {  
      //Si ya existe el producto en el carrito, le sumo la cantidad nueva comprada
      const db = getFirestore();
      const datoItem = doc(db, "productos", (item.slug));

      getDoc(datoItem).then((snapshot) => {
        if(snapshot.exists()){
          const arr = {id: snapshot.id, ...snapshot.data()}
          item.stock = arr.stock
        }
     })


      if(isInCart(item.codigo)){
        (items.find(p => p.codigo===(item.codigo))).cantidad = (items.find(p => p.codigo===(item.codigo))).cantidad + quantity;
        setItems(items)
      } else {   //Si no existe, agrego un nuevo producto al carrito
        item.cantidad = quantity 
        setItems( prevState => prevState.concat(item) )
       }   
    }
  //  console.log(items)

    function sumar(cantidad, cantidadagregar){
      setCantidad(cantidad + cantidadagregar)
    }

    //Elimino todos los productos del carrito
    const clear = () => {
        setItems([])
    }

    //Función para ver si ya existe el producto en el carrito
      function isInCart(id){
         return items.find(p => p.codigo===id)
      }

      //Elimino un producto en particular del carrito
      function removeItem(id){
        setItems(items.filter(p => p.codigo!==id))
      }


      function cantidadFn(items, inicial){
        setCantidad(items.reduce((acumulador, items) => acumulador + items.cantidad, inicial))
      }


      return (
        <CartContext.Provider value={{items, addItem, clear, removeItem, cantidadactual, cantidadFn, sumar}}>
          {children}
        </CartContext.Provider>
      )

}

export  {CartProvider}