import { Container, Link, Stack, Typography } from '@mui/material';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Adornment } from './Adornment';
import { Basic } from './Basic';
import { Color } from './Color';
import { Controlled } from './Controlled';
import { Error } from './Error';
import { FormProps } from './FormProps';
import { FullWidth } from './FullWidth';
import { Limitations } from './Limitations';
import { Multiline } from './Multiline';
import { Sizes } from './Sizes';

const App = () => {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={5}>
                <Stack spacing={1}>
                    <Typography variant='h4'>@jackstenglein/mui-mentions</Typography>
                    <Typography>
                        Mention people in a{' '}
                        <Link href='https://mui.com/material-ui/react-text-field/'>MUI TextField</Link>.
                    </Typography>
                </Stack>

                <Basic />
                <FormProps />
                <Error />
                <Multiline />
                <Adornment />
                <Sizes />
                <FullWidth />
                <Controlled />
                <Color />

                <Limitations />

                {/* <MentionsTextField
                variant='filled'
                label='Test Filled'
                value={value}
                onChange={(newValue) => setValue(newValue)}
                fullWidth
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

            <MentionsTextField
                variant='outlined'
                label='Test Outlined'
                value={value}
                onChange={(newValue) => setValue(newValue)}
                fullWidth
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

            <MentionsTextField
                variant='standard'
                label='Test Standard'
                value={value}
                onChange={(newValue) => setValue(newValue)}
                fullWidth
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

            <MentionsTextField
                label='Test Multiline'
                multiline
                minRows={3}
                maxRows={5}
                value={value}
                onChange={(newValue) => setValue(newValue)}
                fullWidth
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
            /> */}
            </Stack>
        </Container>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
