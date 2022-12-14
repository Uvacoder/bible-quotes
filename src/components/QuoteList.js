import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, where, limit, startAfter } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth0 } from '@auth0/auth0-react'

function QuoteList(props) {

  const { user, isAuthenticated, isLoading } = useAuth0()
  const [quotesLoading, setQuotesLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [quotes, setQuotes] = useState([])
  const [lastDoc, setLastDoc] = useState()

  /* function to get all quotes from firestore in realtime */
  useEffect(() => {
    if (isAuthenticated) {
      let quotesRef

      if (props.topic) {
        quotesRef = query(collection(db, 'users', user.email, 'quotes'), where('topic', '==', `${props.topic}`), orderBy('created', 'desc'), limit(10))
      } else {
        quotesRef = query(collection(db, 'users', user.email, 'quotes'), orderBy('created', 'desc'), limit(10))
      }
      onSnapshot(quotesRef, (querySnapshot) => {
        let quotesArray = []
        querySnapshot.docs.forEach((quote) => {
          quotesArray.push({
            id: quote.id,
            data: quote.data(),
          })
        })
  
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length-1])
        setQuotes(quotesArray)
        setQuotesLoading(false)
      })
    } else {
      !isLoading && setQuotesLoading(false)
    }
  },[isAuthenticated, isLoading, props.topic])

  /* function to get more quotes from firestore */
  function fetchMore() {
    setMoreLoading(true)
    let quotesRef
    if (props.topic) {
      quotesRef = query(collection(db, 'users', user.email, 'quotes'), where('topic', '==', `${props.topic}`), orderBy('created', 'desc'), limit(10), startAfter(lastDoc))
    } else {
      quotesRef = query(collection(db, 'users', user.email, 'quotes'), orderBy('created', 'desc'), limit(10), startAfter(lastDoc))
    }
    onSnapshot(quotesRef, (querySnapshot) => {
      if (querySnapshot.size === 0) {
        setIsEmpty(true)
      } else {
        let quotesArray = []
        querySnapshot.docs.forEach((quote) => {
          quotesArray.push({
            id: quote.id,
            data: quote.data(),
          })
        })

        setLastDoc(querySnapshot.docs[querySnapshot.docs.length-1])
        setQuotes([...quotes, ...quotesArray])
        setMoreLoading(false)
      }
    })
  }

  /* function to delete a quote */
  function deleteQuote(quoteId) {
    try {
      deleteDoc(doc(db, 'users', user.email, 'quotes', quoteId))
    } catch (err) {
      alert(err)
    }
  }

  let quoteList
  if (quotesLoading) {
    quoteList = <div className='quote-list-empty'>Loading...</div>
  } else if (quotes.length) {
    quoteList = (
      <ul className='quote-list'>
        {quotes.map(quote => (
          <div key={quote.id} className='quote-list-result'>
            <div className='quote-list-item'>
              <span className='quote-list-text'>
                {quote.data.text}
              </span>
              <div className='quote-list-buttons'>
                <button
                  className='copy-quote'
                  onClick={() => navigator.clipboard.writeText(quote.data.text)}
                >
                  <i className='fa fa-copy'></i>
                </button>
                <button
                  className='delete-quote'
                  onClick={() => { if (window.confirm('Are you sure?')) deleteQuote(quote.id) }}
                >
                  <i className='fa fa-trash'></i>
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className='more'>
          {isEmpty
            ? (
                <button className='btn-more' onClick={fetchMore}>
                  <span>No More Data</span>
                </button>
              )
            : moreLoading
              ? (
                  <button className='btn-more'>
                    <span>Loading...</span>
                  </button>
                )
              : (
                  <button className='btn-more' onClick={fetchMore}>
                    <span>Show More</span>
                  </button>
                )
          }
        </div>
      </ul>
    )
  } else {
    quoteList = <div className='quote-list-empty'>No quotes</div>
  }

  return (
    <>
      {quoteList}
    </>
  )
}

export default QuoteList
