function AuthForms() {
    const [activeForm, setActiveForm] = React.useState('login');
    const [message, setMessage] = React.useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const endpoint = activeForm === 'login' ? '/login' : '/signup';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            setMessage(result.message);

            if (response.ok) {
                if (activeForm === 'signup') {
                    setActiveForm('login');
                } else if (result.redirect) {
                    window.location.href = result.redirect;
                }
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        }
    };

    return (
        <div>
            <div>
                <button onClick={() => setActiveForm('login')}>Login</button>
                <button onClick={() => setActiveForm('signup')}>Sign Up</button>
            </div>
            {message && <p>{message}</p>}
            {activeForm === 'login' ? (
                <form onSubmit={handleSubmit}>
                    <input type="email" name="email" placeholder="Email" required />
                    <input type="password" name="password" placeholder="Password" required />
                    <label>
                        <input type="checkbox" name="remember" /> Remember me
                    </label>
                    <button type="submit">Login</button>
                </form>
            ) : (
                <form onSubmit={handleSubmit}>
                    <input type="email" name="email" placeholder="Email" required />
                    <input type="text" name="name" placeholder="Name" required />
                    <input type="password" name="password" placeholder="Password" required />
                    <button type="submit">Sign Up</button>
                </form>
            )}
        </div>
    );
}

ReactDOM.render(<AuthForms />, document.getElementById('auth-forms'));