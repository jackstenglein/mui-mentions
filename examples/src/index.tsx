import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { MentionsTextField } from '../../src';

const App = () => {
    const [value, setValue] = useState('');

    return (
        <div>
            <MentionsTextField
                value={value}
                onChange={(newValue) => setValue(newValue)}
                multiline
                fullWidth
                minRows={3}
                maxRows={7}
                dataSources={[
                    {
                        trigger: '@',
                        markup: '@[__display__](__id__)',
                        data: [
                            { id: '1', display: 'Test 1' },
                            { id: '2', display: 'Test 2' },
                            { id: '3', display: 'Test 3' },
                            { id: '4', display: 'Test 4' },
                            { id: '5', display: 'Test 5' },
                            { id: '6', display: 'Test 6' },
                            { id: '7', display: 'Test 7' },
                            { id: '8', display: 'Test 8' },
                            { id: '9', display: 'Test 9' },
                            { id: '10', display: 'Test 10' },
                            { id: '11', display: 'Test 11' },
                            { id: '12', display: 'Test 12' },
                            { id: '13', display: 'Test 13' },
                            { id: '14', display: 'Test 14' },
                            { id: '15', display: 'Test 15' },
                            { id: '16', display: 'Test 16' },
                            { id: '17', display: 'Test 17' },
                            { id: '18', display: 'Test 18' },
                            { id: '19', display: 'Test 19' },
                            { id: '20', display: 'Test 20' },
                            { id: '21', display: 'Test 21' },
                            { id: '22', display: 'Test 22' },
                            { id: '23', display: 'Test 23' },
                            { id: '24', display: 'Test 24' },
                            { id: '25', display: 'Test 25' },
                        ],
                        allowSpaceInQuery: false,
                        appendSpaceOnAdd: true,
                        displayTransform: (_id, display) => `@${display}`,
                    },
                ]}
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
