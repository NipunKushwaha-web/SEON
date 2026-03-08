import React, { createContext, useState, useContext } from 'react';

// 1. Context create karein
export const UserContext = createContext();

// 2. Provider banayein
export const UserProvider = ({ children }) => {
    // Agar aap chahein toh default user localStorage se utha sakte hain (Optional)
    // const [ user, setUser ] = useState(JSON.parse(localStorage.getItem('user')) || null);
    
    const [ user, setUser ] = useState(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};

// 3. Custom Hook banayein (Yeh missing tha)
// Isse aap kisi bhi component mein direct 'const { user } = useUser()' likh payenge
export const useUser = () => {
    return useContext(UserContext);
};