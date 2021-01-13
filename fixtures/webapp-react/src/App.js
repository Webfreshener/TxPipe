import logo from './logo.svg';
import './App.css';

let options = [];
const _tx = new window.TxPipe.TxPipe(
    [
        (d) => `<option value="${d}">${d}</option>`
    ],
    {
        type: "array",
        items: {
            type: "string",
            pattern: "^<option+\\s+value=\"\\w+\">+\\w+<\\/option>+",
        },
    },
);

_tx.subscribe({
    next: (d) => console.log(options = d),
    error: alert,
})
_tx.txWrite(["a", "b", "c"]);

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <form>
                    <select>
                        {/*{options}*/}
                    </select>
                </form>
            </header>
        </div>
    );
}

export default App;
