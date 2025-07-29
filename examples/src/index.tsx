import {
    Container,
    CssBaseline,
    FormControlLabel,
    Link,
    Stack,
    Switch,
    ThemeProvider,
    Typography,
    createTheme,
} from '@mui/material';
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Adornment } from './Adornment';
import { AppendSpaceOnAdd } from './AppendSpaceOnAdd';
import { AsychronousData } from './AsynchronousData';
import { Basic } from './Basic';
import { Color } from './Color';
import { Controlled } from './Controlled';
import { DisplayTransform } from './DisplayTransform';
import { Error } from './Error';
import { FormProps } from './FormProps';
import { FullWidth } from './FullWidth';
import { Images } from './Images';
import { Limitations } from './Limitations';
import { Multiline } from './Multiline';
import { MultipleDataSources } from './MultipleDataSources';
import { ShowTriggerInDisplay } from './ShowTriggerInDisplay';
import { Sizes } from './Sizes';
import { Trigger } from './Trigger';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const lightTheme = createTheme();

const App = () => {
    const [mode, setMode] = useState('dark');

    return (
        <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
            <CssBaseline />
            <Container sx={{ py: 5 }}>
                <Stack spacing={5}>
                    <Stack spacing={1}>
                        <Typography variant='h4'>@jackstenglein/mui-mentions</Typography>
                        <Typography>
                            Mention people in a{' '}
                            <Link href='https://mui.com/material-ui/react-text-field/'>MUI TextField</Link>.
                        </Typography>

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={mode === 'dark'}
                                    onChange={(e) => setMode(e.target.checked ? 'dark' : 'light')}
                                />
                            }
                            label='Dark Mode'
                        />
                    </Stack>

                    <Basic />
                    <Trigger />
                    <MultipleDataSources />
                    <ShowTriggerInDisplay />
                    <AppendSpaceOnAdd />
                    <DisplayTransform />
                    <AsychronousData />

                    <FormProps />
                    <Error />
                    <Multiline />
                    <Adornment />
                    <Sizes />
                    <FullWidth />
                    <Controlled />
                    <Color />
                    <Images />
                    <Limitations />
                </Stack>
            </Container>
        </ThemeProvider>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
