import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper,
    InputAdornment,
    IconButton,
    CircularProgress
} from '@mui/material';
import { Shield, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';

const SuperLogin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await apiService.superLogin(password);

            if (result.success && result.user) {
                const userObj = typeof result.user === 'string' ? JSON.parse(result.user) : result.user;
                login({ ...userObj, venueId: result.venueId || null });
                navigate('/super-admin');
            } else {
                setError(result.error || 'Authentication failed.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                backgroundColor: '#111',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
            }}
        >
            <Paper
                elevation={24}
                sx={{
                    p: { xs: 4, sm: 6 },
                    width: '100%',
                    maxWidth: 400,
                    backgroundColor: '#1E1E1E',
                    borderRadius: 4,
                    border: '1px solid rgba(212, 175, 55, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Shield sx={{ fontSize: 48, color: '#D4AF37', mb: 2 }} />
                <Typography
                    variant="h4"
                    sx={{
                        color: '#D4AF37',
                        fontFamily: '"Bebas Neue", "Roboto", "Helvetica", "Arial", sans-serif',
                        letterSpacing: '0.05em',
                        mb: 1,
                        textAlign: 'center',
                    }}
                >
                    SUPER ADMIN
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 4, textAlign: 'center' }}>
                    Restricted Access Area
                </Typography>

                <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
                    <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter Password"
                        variant="outlined"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                color: 'white',
                                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.2)' },
                                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                                '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Shield sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    {error && (
                        <Typography color="error" variant="body2" sx={{ mb: 3, textAlign: 'center' }}>
                            {error}
                        </Typography>
                    )}

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={isLoading}
                        sx={{
                            py: 1.5,
                            backgroundColor: '#D4AF37',
                            color: '#000',
                            fontWeight: 'bold',
                            '&:hover': {
                                backgroundColor: '#b5952f',
                            },
                        }}
                    >
                        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'SECURE LOGIN'}
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
};

export default SuperLogin;
