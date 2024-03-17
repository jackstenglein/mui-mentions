import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Mention, MentionsInput, MyCounter } from '../../src';

const App = () => {
    const [value, setValue] = useState('');

    return (
        <div>
            <div>
                <h2>Default counter</h2>
                <MyCounter />
            </div>
            <hr />
            <div>
                <h2>Counter with predefined value</h2>
                <MyCounter value={5} />
            </div>
            <div>
                <MentionsInput
                    value={value}
                    onChange={(_e, v) => setValue(v)}
                    dataSources={[
                        {
                            trigger: '@',
                            markup: '@[__display__](__id__)',
                            data: [
                                { id: '1', display: 'Test 1' },
                                { id: '2', display: 'Test 2' },
                                { id: '3', display: 'Test 2' },
                                { id: '4', display: 'Test 2' },
                                { id: '5', display: 'Test 2' },
                                { id: '6', display: 'Test 2' },
                                { id: '7', display: 'Test 2' },
                                { id: '8', display: 'Test 2' },
                                { id: '9', display: 'Test 2' },
                                { id: '10', display: 'Test 2' },
                                { id: '11', display: 'Test 2' },
                                { id: '12', display: 'Test 2' },
                                { id: '13', display: 'Test 2' },
                                { id: '14', display: 'Test 2' },
                                { id: '15', display: 'Test 2' },
                                { id: '16', display: 'Test 2' },
                                { id: '17', display: 'Test 2' },
                            ],
                            allowSpaceInQuery: false,
                        },
                    ]}
                ></MentionsInput>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
